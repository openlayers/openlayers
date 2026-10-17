/**
 * @module ol/render/webgpu/declutter
 */
import RBush from 'rbush';
import {DECLUTTER_SHADER} from '../../webgpu/shaders.js';

/**
 * @typedef {Object} Label
 * @property {number} minX Min x (screen pixels, or pixel offsets relative to `_anchor`).
 * @property {number} minY Min y.
 * @property {number} maxX Max x.
 * @property {number} maxY Max y.
 * @property {number} priority Lower is higher priority.
 * @property {number} [zIndex] Style z-index. Higher paints later.
 * @property {number} [classRank] Canvas class order.
 * @property {number} [sequence] Render sequence. Same priority, the earlier sequence keeps the space.
 * @property {number} [featureRef] Feature ref for hit testing.
 * @property {number} [id] Stable id for tie-breaking when no sequence is set (feature uid).
 * @property {Array<number>} [padding] Collision padding `[top, right, bottom, left]`.
 * @property {import("../../style/Style.js").DeclutterMode} [mode='declutter'] Mode.
 * @property {number} [pairId] Image+text pair id; both members shown or neither when mode is declutter.
 * @property {number} [glyphStart] Glyph instance start.
 * @property {number} [glyphCount] Glyph instance count.
 * @property {number} [symbolIndex] Index into symbolInstances (stride `SYMBOL_STRIDE`).
 * @property {number} [iconIndex] Index into iconInstances (stride `ICON_STRIDE`).
 * @property {string} [text] Displayed text; used for fade continuity across tile zooms.
 * @property {import("../../coordinate.js").Coordinate} [_anchor] World-space anchor for point labels.
 * @property {Array<number>} [_corners] Icon corners relative to the anchor.
 * @property {number} [_rotation] Icon rotation.
 * @property {boolean} [_rotateWithView] Whether the icon rotates with the view.
 * @property {string} [_identityKey] Symbol content/style key used for cross-tile matching.
 */

export const MODE_DECLUTTER = 0;
export const MODE_OBSTACLE = 1;
export const MODE_NONE = 2;

/**
 * @typedef {{minX: number, minY: number, maxX: number, maxY: number}} DeclutterBox
 */

/**
 * Shared RBush per declutter group and frame (WebGPU layers only).
 * @type {Map<string, {frame: number, tree: import('rbush').default<DeclutterBox>}>}
 */
const groupTrees = new Map();

/**
 * Collision work extends beyond the viewport so accepted labels finish their
 * transition before panning into view.
 * @type {number}
 */
export const VIEWPORT_PADDING = 100;

/**
 * Transform-independent priority order cached for each reused LabelView box
 * array.
 * @type {WeakMap<Array<Label>, {
 *   priorities: Array<number>,
 *   ids: Array<number|undefined>,
 *   sequences: Array<number|undefined>,
 *   pairs: Array<number|undefined>,
 *   modes: Array<import("../../style/Style.js").DeclutterMode|undefined>,
 *   order: Array<{label: Label, index: number}>
 * }>}
 */
const orderCache = new WeakMap();

/**
 * Whether cached ordering fields still match mutable screen boxes.
 * @param {NonNullable<ReturnType<typeof orderCache.get>>} cached Cache.
 * @param {Array<Label>} labels Labels.
 * @return {boolean} The cached order is valid.
 */
function sameOrder(cached, labels) {
  if (cached.priorities.length !== labels.length) {
    return false;
  }
  for (let i = 0; i < labels.length; ++i) {
    const label = labels[i];
    if (
      cached.priorities[i] !== label.priority ||
      cached.ids[i] !== label.id ||
      cached.sequences[i] !== label.sequence ||
      cached.pairs[i] !== label.pairId ||
      cached.modes[i] !== label.mode
    ) {
      return false;
    }
  }
  return true;
}

/**
 * @param {import("../../style/Style.js").DeclutterMode|undefined} mode Mode.
 * @return {number} Numeric mode.
 */
export function modeToInt(mode) {
  if (mode === 'obstacle') {
    return MODE_OBSTACLE;
  }
  if (mode === 'none') {
    return MODE_NONE;
  }
  return MODE_DECLUTTER;
}

/**
 * @typedef {Object} DeclutterItem
 * @property {Label} label Label to place, or the union of a pair's labels.
 * @property {number} index Index of the (first) label in the input.
 * @property {Array<number>} [members] Indices of every label placed with this one.
 * @property {boolean} [sticky] Was visible in the previous placement.
 */

/**
 * @param {Set<number>|undefined} stickyIds Previously visible label ids.
 * @return {function(DeclutterItem, DeclutterItem): number} Compare.
 */
function createCompare(stickyIds) {
  const sticky = stickyIds && stickyIds.size ? stickyIds : undefined;
  return (a, b) => {
    if (sticky) {
      const stickyA =
        a.sticky === true ||
        (a.label.id !== undefined && sticky.has(a.label.id));
      const stickyB =
        b.sticky === true ||
        (b.label.id !== undefined && sticky.has(b.label.id));
      if (stickyA !== stickyB) {
        return stickyA ? -1 : 1;
      }
    }
    if (a.label.priority !== b.label.priority) {
      return a.label.priority - b.label.priority;
    }
    if (a.label.sequence !== undefined || b.label.sequence !== undefined) {
      const seqA = a.label.sequence ?? a.index;
      const seqB = b.label.sequence ?? b.index;
      if (seqA !== seqB) {
        return seqA - seqB;
      }
      return a.index - b.index;
    }
    const idA = a.label.id ?? a.index;
    const idB = b.label.id ?? b.index;
    if (idA !== idB) {
      return idA - idB;
    }
    return a.index - b.index;
  };
}

/**
 * Collect ids of visible labels so later frames can prefer them.
 *
 * @param {Array<Label>} labels Labels.
 * @param {Array<boolean>} visibility Visibility aligned with `labels`.
 * @return {Set<number>} Visible ids.
 */
export function collectStickyIds(labels, visibility) {
  /** @type {Set<number>} */
  const ids = new Set();
  for (let i = 0; i < labels.length; ++i) {
    if (!visibility[i]) {
      continue;
    }
    const id = labels[i].id;
    if (id !== undefined) {
      ids.add(id);
    }
  }
  return ids;
}

/**
 * Keep a label visible when the copy that won placement has left.
 *
 * Neighboring tiles store their own copy as hidden, because only one may
 * draw. While placement is deferred, losing the winning tile would fade the
 * label out even though another copy is still in the same place. One surviving
 * copy, preferring the unwrapped world, stands in until placement runs.
 *
 * @param {Array<boolean>} visibility Visibility aligned with `identities`.
 * @param {Array<number>} identities Persistent ids aligned with `visibility`.
 * @param {Set<number>} stickyIds Ids visible after the last placement.
 * @param {Array<number>} [worldOffsets] World x offsets aligned with `visibility`.
 * @return {boolean} Whether a surviving copy was made visible.
 */
export function retainVisibleIdentities(
  visibility,
  identities,
  stickyIds,
  worldOffsets,
) {
  if (!stickyIds?.size) {
    return false;
  }
  const seen = new Set();
  for (let i = 0; i < visibility.length; ++i) {
    if (visibility[i]) {
      seen.add(identities[i]);
    }
  }
  /** @type {Map<number, number>} */
  const chosen = new Map();
  for (let i = 0; i < visibility.length; ++i) {
    const id = identities[i];
    if (id === undefined || seen.has(id) || !stickyIds.has(id)) {
      continue;
    }
    const current = chosen.get(id);
    const unwrapped = !worldOffsets?.[i];
    if (current === undefined || (unwrapped && worldOffsets?.[current])) {
      chosen.set(id, i);
    }
  }
  for (const index of chosen.values()) {
    visibility[index] = true;
  }
  return chosen.size > 0;
}

/**
 * CPU declutter matching Canvas greedy semantics: higher-priority labels
 * claim space first (exact AABB, same as the Canvas RBush). Hidden labels do
 * not occupy space. When labels carry a render sequence, the earlier one
 * keeps the space. Otherwise a stable `id` (feature uid) is the tie-breaker
 * so query order cannot flip winners while panning.
 *
 * When `stickyIds` is set, previously visible labels claim space before
 * newcomers, so a neighbor that just became unblocked, or a copy from a tile
 * that replaced another, cannot evict a label that was already shown. This
 * holds while zooming out too: a label then only disappears when another
 * label that was already shown takes its space.
 *
 * @param {Array<Label>} labels Labels (not necessarily sorted).
 * @param {number} [cellSize] Ignored; kept for call-site compatibility.
 * @param {number} [width] Ignored; kept for call-site compatibility.
 * @param {number} [height] Ignored; kept for call-site compatibility.
 * @param {string} [groupKey] Shared occupancy group (WebGPU layers only).
 * @param {number} [frameIndex] Frame index; occupancy resets when this changes.
 * @param {Set<number>} [stickyIds] Previously visible ids; prefer these first.
 * @return {Array<boolean>} Visibility, aligned with the input array.
 */
export function resolveDeclutter(
  labels,
  cellSize = 8,
  width = 2048,
  height = 2048,
  groupKey,
  frameIndex,
  stickyIds,
) {
  const compare = createCompare(stickyIds);
  let cachedOrder = orderCache.get(labels);
  if (!cachedOrder || !sameOrder(cachedOrder, labels)) {
    cachedOrder = {
      priorities: labels.map((label) => label.priority),
      ids: labels.map((label) => label.id),
      sequences: labels.map((label) => label.sequence),
      pairs: labels.map((label) => label.pairId),
      modes: labels.map((label) => label.mode),
      order: labels
        .map((label, index) => ({label, index}))
        .sort(createCompare(undefined)),
    };
    orderCache.set(labels, cachedOrder);
  }
  const baseOrder = cachedOrder.order;
  const order =
    stickyIds && stickyIds.size
      ? baseOrder
          .filter(
            (item) =>
              item.label.id !== undefined && stickyIds.has(item.label.id),
          )
          .concat(
            baseOrder.filter(
              (item) =>
                item.label.id === undefined || !stickyIds.has(item.label.id),
            ),
          )
      : baseOrder;

  // Group the image and text halves of a pair up front. Searching the whole
  // list per item instead would be quadratic in the label count, which a busy
  // vector tile view reaches easily.
  /** @type {Map<number, Array<{label: Label, index: number}>>} */
  const byPair = new Map();
  for (const item of order) {
    const pairId = item.label.pairId;
    if (pairId === undefined || item.label.mode === 'none') {
      continue;
    }
    const members = byPair.get(pairId);
    if (members) {
      members.push(item);
    } else {
      byPair.set(pairId, [item]);
    }
  }

  /** @type {Array<DeclutterItem>} */
  const units = [];
  const consumed = new Set();

  for (const item of order) {
    if (consumed.has(item.index)) {
      continue;
    }
    const pairId = item.label.pairId;
    if (pairId !== undefined && item.label.mode !== 'none') {
      const members = byPair.get(pairId) || [item];
      for (const member of members) {
        consumed.add(member.index);
      }
      /** @type {Label} */
      const union = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        priority: Infinity,
        id: Infinity,
        mode: 'declutter',
      };
      let allObstacle = true;
      let sticky = false;
      let sequence;
      for (const member of members) {
        union.minX = Math.min(union.minX, member.label.minX);
        union.minY = Math.min(union.minY, member.label.minY);
        union.maxX = Math.max(union.maxX, member.label.maxX);
        union.maxY = Math.max(union.maxY, member.label.maxY);
        union.priority = Math.min(union.priority, member.label.priority);
        union.id = Math.min(
          union.id ?? Infinity,
          member.label.id ?? member.index,
        );
        if (member.label.sequence !== undefined) {
          sequence =
            sequence === undefined
              ? member.label.sequence
              : Math.min(sequence, member.label.sequence);
        }
        if (member.label.mode !== 'obstacle') {
          allObstacle = false;
        }
        if (member.label.id !== undefined && stickyIds?.has(member.label.id)) {
          sticky = true;
        }
      }
      union.mode = allObstacle ? 'obstacle' : 'declutter';
      if (sequence !== undefined) {
        union.sequence = sequence;
      }
      units.push({
        label: union,
        index: item.index,
        members: members.map((m) => m.index),
        sticky,
      });
      continue;
    }
    consumed.add(item.index);
    units.push({
      label: item.label,
      index: item.index,
      members: [item.index],
      sticky: item.label.id !== undefined && stickyIds?.has(item.label.id),
    });
  }

  units.sort(compare);

  /** @type {import('rbush').default<DeclutterBox>} */
  let tree;
  if (groupKey !== undefined && frameIndex !== undefined) {
    const key = groupKey;
    const state = groupTrees.get(key);
    if (!state || state.frame !== frameIndex) {
      tree = new RBush(9);
      groupTrees.set(key, {frame: frameIndex, tree});
    } else {
      tree = state.tree;
    }
  } else {
    tree = new RBush(9);
  }
  const visible = new Array(labels.length).fill(false);
  const seenIdentities = new Set();

  for (const unit of units) {
    const label = unit.label;
    if (
      label.maxX < -VIEWPORT_PADDING ||
      label.minX > width + VIEWPORT_PADDING ||
      label.maxY < -VIEWPORT_PADDING ||
      label.minY > height + VIEWPORT_PADDING
    ) {
      continue;
    }
    if (label.id !== undefined && seenIdentities.has(label.id)) {
      continue;
    }
    if (label.mode === 'none') {
      for (const index of unit.members ?? [unit.index]) {
        visible[index] = true;
      }
      if (label.id !== undefined) {
        seenIdentities.add(label.id);
      }
      continue;
    }
    const box = {
      minX: label.minX,
      minY: label.minY,
      maxX: label.maxX,
      maxY: label.maxY,
    };
    if (label.mode !== 'obstacle' && tree.collides(box)) {
      continue;
    }
    for (const index of unit.members ?? [unit.index]) {
      visible[index] = true;
    }
    if (label.id !== undefined) {
      seenIdentities.add(label.id);
    }
    tree.insert(box);
  }
  return visible;
}

/**
 * Dispatch the GPU declutter compute pass. Labels must already be sorted by
 * priority. Pair merging and shared occupancy groups are handled on the CPU
 * (`resolveDeclutter`) so Canvas image+text all-or-nothing semantics hold;
 * this shader implements the occupancy-grid claim for a single sorted list.
 *
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 * @param {Array<Label>} labels Sorted labels.
 * @param {number} width Viewport width.
 * @param {number} height Viewport height.
 * @param {number} [cellSize] Cell size.
 * @return {GPUBuffer} Visibility buffer (u32 per label).
 */
export function dispatchDeclutterCompute(
  helper,
  labels,
  width,
  height,
  cellSize = 8,
) {
  const device = helper.getDevice();
  const count = labels.length;
  const gridWidth = Math.max(1, Math.ceil(width / cellSize));
  const gridHeight = Math.max(1, Math.ceil(height / cellSize));
  const labelStride = 8; // 4 f32 aabb + 4 u32
  const labelData = new ArrayBuffer(Math.max(count, 1) * labelStride * 4);
  const f32 = new Float32Array(labelData);
  const u32 = new Uint32Array(labelData);
  for (let i = 0; i < count; ++i) {
    const label = labels[i];
    const o = i * labelStride;
    f32[o] = label.minX;
    f32[o + 1] = label.minY;
    f32[o + 2] = label.maxX;
    f32[o + 3] = label.maxY;
    u32[o + 4] = label.priority >>> 0;
    u32[o + 5] = modeToInt(label.mode);
    u32[o + 6] = label.pairId ?? 0;
  }

  const labelBuffer = helper.createBuffer(
    labelData,
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  );
  const occupancyBuffer = helper.createBuffer(
    new Uint32Array(Math.max(1, gridWidth * gridHeight)),
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  );
  const visibilityBuffer = device.createBuffer({
    size: Math.max(4, count * 4),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const paramsData = new Uint32Array([count, gridWidth, gridHeight, 0]);
  const paramsF32 = new Float32Array(paramsData.buffer);
  paramsF32[3] = cellSize;
  const paramsBuffer = helper.createBuffer(
    paramsData,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  );

  const pipeline = helper.getComputePipeline('declutter', {
    layout: 'auto',
    compute: {
      module: helper.createShaderModule(DECLUTTER_SHADER),
      entryPoint: 'cs_main',
    },
  });
  const encoder = helper.getEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(
    0,
    device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: labelBuffer}},
        {binding: 1, resource: {buffer: occupancyBuffer}},
        {binding: 2, resource: {buffer: visibilityBuffer}},
        {binding: 3, resource: {buffer: paramsBuffer}},
      ],
    }),
  );
  pass.dispatchWorkgroups(1);
  pass.end();
  return visibilityBuffer;
}
