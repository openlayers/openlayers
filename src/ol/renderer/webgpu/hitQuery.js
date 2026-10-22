/**
 * @module ol/renderer/webgpu/hitQuery
 */
import {assert} from '../../asserts.js';

/**
 * The most hit passes one query runs. Each pass after the first reveals the
 * features that the ones already found were covering.
 * @type {number}
 */
const MAX_PASSES = 8;

/**
 * The most batches, such as tiles, a single query can tell apart. A batch index
 * travels in one byte of the hit color.
 * @type {number}
 */
export const MAX_HIT_BATCHES = 256;

/**
 * The most features a batch can have for its features to be told apart in a
 * query across batches. Only 16 bits of a feature reference are left once the
 * batch index has taken the third byte.
 * @type {number}
 */
export const MAX_BATCHED_FEATURES = 65535;

/**
 * The value of the `hitDetection` frame uniform that makes a hit pass write
 * the feature reference unchanged, which keeps all 24 bits of it.
 * @type {number}
 */
export const HIT_MODE_FEATURE = 1;

/**
 * The value of the `hitDetection` frame uniform for the batch with the given
 * index. A hit pass then writes the index in place of the reference's third
 * byte. See `hitOutput` in the shaders.
 *
 * @param {number} index Batch index below {@link MAX_HIT_BATCHES}.
 * @return {number} Uniform value.
 */
export function hitModeForBatch(index) {
  return 2 + index;
}

/**
 * @type {WeakMap<import("../../render/webgpu/buffers.js").VectorBuffers, boolean>}
 */
const fitsBatched = new WeakMap();

/**
 * The `hitDetection` frame uniform for a tile in a hit pass, or 0 when the
 * pass cannot tell the tile's features apart from other tiles', because the
 * tile is past {@link MAX_HIT_BATCHES} or has more than
 * {@link MAX_BATCHED_FEATURES} features.
 *
 * @param {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers of the tile.
 * @param {number} index Index of the tile in the pass.
 * @return {number} Uniform value, or 0 to leave the tile out.
 */
export function hitModeForTile(buffers, index) {
  if (index >= MAX_HIT_BATCHES) {
    return 0;
  }
  let fits = fitsBatched.get(buffers);
  if (fits === undefined) {
    fits = Object.keys(buffers.featuresByRef).length <= MAX_BATCHED_FEATURES;
    fitsBatched.set(buffers, fits);
  }
  return fits ? hitModeForBatch(index) : 0;
}

/**
 * The draw commands of a batch that a hit pass has to run.
 *
 * @param {Array<import("../../render/webgpu/drawOrder.js").DrawCommand>} commands Commands of the batch.
 * @param {number} batch Index of the batch in the pass.
 * @param {Set<number>|null|undefined} excluded Keys of the features to leave
 * out, see {@link hitKey}. When it is not set, this is not a later pass, and all
 * commands are returned.
 * @return {Array<import("../../render/webgpu/drawOrder.js").DrawCommand>} Commands.
 */
export function commandsToHit(commands, batch, excluded) {
  if (!excluded) {
    return commands;
  }
  return commands.filter(
    (command) =>
      command.pipeline !== 'glyph' &&
      !excluded.has(hitKey(batch, command.featureRef)),
  );
}

/**
 * A key for a feature seen in a hit pass, unique across batches.
 *
 * @param {number} batch Batch index, or 0 where batches are not told apart.
 * @param {number} ref Feature reference.
 * @return {number} Key.
 */
export function hitKey(batch, ref) {
  return batch * 0x1000000 + ref;
}

/**
 * @typedef {Object} HitRegion
 * @property {import("../../webgpu/Helper.js").HitRect} rect Pixels to draw and read.
 * @property {number} x Pointer x in canvas pixels.
 * @property {number} y Pointer y in canvas pixels.
 * @property {number} radius Hit tolerance in canvas pixels.
 */

/**
 * The part of the canvas a query looks at: the pixel under the pointer, and
 * the pixels the hit tolerance reaches from it.
 *
 * @param {import("../../pixel.js").Pixel} pixel Pointer, in CSS pixels.
 * @param {number} hitTolerance Tolerance in CSS pixels.
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @return {HitRegion|null} Region, or `null` when it lies outside the canvas.
 */
export function hitRegion(pixel, hitTolerance, frameState) {
  const pixelRatio = frameState.pixelRatio;
  const canvasWidth = Math.max(1, Math.round(frameState.size[0] * pixelRatio));
  const canvasHeight = Math.max(1, Math.round(frameState.size[1] * pixelRatio));
  const x = pixel[0] * pixelRatio;
  const y = pixel[1] * pixelRatio;
  const radius = hitTolerance * pixelRatio;
  const left = Math.max(0, Math.floor(x - radius));
  const top = Math.max(0, Math.floor(y - radius));
  const right = Math.min(canvasWidth - 1, Math.floor(x + radius));
  const bottom = Math.min(canvasHeight - 1, Math.floor(y + radius));
  if (right < left || bottom < top) {
    return null;
  }
  return {
    rect: {x: left, y: top, width: right - left + 1, height: bottom - top + 1},
    x,
    y,
    radius,
  };
}

/**
 * @typedef {Object} Hit
 * @property {number} key Key of the feature, see {@link hitKey}.
 * @property {number} batch Batch index.
 * @property {number} ref Feature reference.
 * @property {number} distance Distance of the nearest pixel showing it from
 * the pointer, in canvas pixels.
 */

/**
 * The distinct features shown in the pixels of a hit pass, nearest first.
 *
 * @param {Uint8Array} pixels Red, green, blue and alpha bytes of the region.
 * @param {HitRegion} region Region.
 * @param {boolean} batched Whether the blue byte holds a batch index. Otherwise
 * it holds the top byte of a 24 bit feature reference.
 * @return {Array<Hit>} Hits.
 */
export function decodeHits(pixels, region, batched) {
  const {rect} = region;
  /** @type {Map<number, Hit>} */
  const hits = new Map();
  for (let row = 0; row < rect.height; ++row) {
    for (let column = 0; column < rect.width; ++column) {
      const offset = (row * rect.width + column) * 4;
      // Feature references start at 1, so a ref of 0 is a pixel nothing drew.
      if (pixels[offset + 3] === 0) {
        continue;
      }
      const distance = Math.hypot(
        rect.x + column + 0.5 - region.x,
        rect.y + row + 0.5 - region.y,
      );
      if (region.radius > 0 && distance > region.radius + 0.5) {
        continue;
      }
      const low = pixels[offset] | (pixels[offset + 1] << 8);
      const batch = batched ? pixels[offset + 2] : 0;
      const ref = batched ? low : low | (pixels[offset + 2] << 16);
      const key = hitKey(batch, ref);
      const hit = hits.get(key);
      if (!hit) {
        hits.set(key, {key, batch, ref, distance});
      } else if (distance < hit.distance) {
        hit.distance = distance;
      }
    }
  }
  return Array.from(hits.values()).sort((a, b) => a.distance - b.distance);
}

/**
 * @typedef {Object} HitQuery
 * @property {number} hitTolerance Tolerance in CSS pixels.
 * @property {boolean} includeOccluded Include features beneath other features.
 * @property {boolean} batched Whether the layer tells batches apart, see {@link decodeHits}.
 * @property {function(Set<number>|null): void} draw Draws the layer into the
 * helper's render pass. The set holds the keys of features to leave out, and is
 * `null` in the first pass, which can use what a frame cached.
 * @property {function(number, number): (import("../../Feature.js").FeatureLike|undefined)} resolve
 * Finds a feature from a batch index and a feature reference.
 * @property {function(): boolean} isStale Tells whether the layer has since
 * replaced what `draw` draws, so that no further pass can be made from it.
 */

/**
 * Features at a pixel, found by drawing the layer with hit colors and reading
 * back what lands near the pointer. A hit pass draws to an offscreen texture,
 * so the canvas is left as it was.
 *
 * A pass shows the topmost feature of each pixel. With `includeOccluded`, the
 * query goes on drawing without the features it has found, until no more come
 * up, so that the result also holds the features they were covering.
 *
 * @param {import("../../webgpu/Helper.js").default} helper Helper.
 * @param {import("../../Map.js").FrameState} frameState Frame state of the
 * frame being shown.
 * @param {import("../../pixel.js").Pixel} pixel Pointer, in CSS pixels.
 * @param {HitQuery} query Query.
 * @return {Promise<Array<import("../../Feature.js").FeatureLike>>} Features,
 * the nearest to the pointer first and the ones beneath them after. Rejects
 * when the device is lost.
 */
export async function queryHits(helper, frameState, pixel, query) {
  assert(!helper.needsToBeRecreated(), 'The WebGPU device was lost');
  const region = hitRegion(pixel, query.hitTolerance, frameState);
  /** @type {Array<import("../../Feature.js").FeatureLike>} */
  const features = [];
  if (!region) {
    return features;
  }
  /** @type {Set<number>} */
  const excluded = new Set();
  for (let pass = 0; pass < MAX_PASSES; ++pass) {
    if (pass > 0 && query.isStale()) {
      break;
    }
    helper.beginHitPass(region.rect);
    query.draw(pass === 0 ? null : excluded);
    const pixels = await helper.finishHitPass(region.rect);
    const hits = decodeHits(pixels, region, query.batched);
    for (const hit of hits) {
      excluded.add(hit.key);
      const feature = query.resolve(hit.batch, hit.ref);
      if (feature && !features.includes(feature)) {
        features.push(feature);
      }
    }
    if (!hits.length || !query.includeOccluded) {
      break;
    }
  }
  return features;
}
