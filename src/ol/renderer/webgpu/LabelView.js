/**
 * @module ol/renderer/webgpu/LabelView
 */
import {extendGlyphBounds} from '../../render/webgpu/glyphLayout.js';
import {LABEL_COLLISION_MARGIN} from './vectorUtil.js';

/**
 * A source of labels, normally one vector tile.
 *
 * @typedef {Object} LabelSource
 * @property {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Labels, glyphs, symbols.
 * @property {number} worldOffset X offset in view coordinates for a wrapped world.
 */

/**
 * @param {import("../../render/webgpu/declutter.js").Label} box Box.
 * @param {Array<number>|undefined} padding `[top, right, bottom, left]`.
 * @param {number} margin Extra margin.
 */
function inflateBox(box, padding, margin) {
  const pad = padding || [0, 0, 0, 0];
  box.minX -= pad[3] + margin;
  box.minY -= pad[0] + margin;
  box.maxX += pad[1] + margin;
  box.maxY += pad[2] + margin;
}

/**
 * @classdesc
 * A flat view over the labels of several tiles, without copying them.
 *
 * Declutter has to see every visible label at once to resolve collisions
 * across tile boundaries, but merging the tiles into one array meant copying
 * every glyph whenever a single tile came or went. This keeps references
 * instead, so a change to the tile set costs one pass over the labels rather
 * than a rebuild of their geometry.
 */
class LabelView {
  constructor() {
    /**
     * @type {Array<import("../../render/webgpu/declutter.js").Label>}
     */
    this.labels = [];

    /**
     * Glyph array each label indexes into, one entry per label.
     * @type {Array<Array<import("../../render/webgpu/glyphLayout.js").GlyphInstance>>}
     */
    this.glyphs = [];

    /**
     * @type {Array<number>}
     */
    this.worldOffsets = [];

    /**
     * Added to a label's `pairId` so image and text pairs of different tiles
     * cannot merge. Tiles number their pairs from one independently.
     * @type {Array<number>}
     */
    this.pairOffsets = [];

    /**
     * Where each source's labels start in the flat arrays.
     * @type {Array<number>}
     */
    this.starts = [];

    /**
     * @type {Array<LabelSource>}
     */
    this.sources = [];

    /**
     * Persistent symbol ids aligned with `labels`.
     * @type {Array<number>}
     */
    this.identities = [];

    /**
     * @private
     * @type {Array<import("../../render/webgpu/declutter.js").Label>}
     */
    this.boxes_ = [];
  }

  /**
   * @param {Array<LabelSource>} sources Label sources, in draw order.
   */
  update(sources) {
    this.labels.length = 0;
    this.glyphs.length = 0;
    this.worldOffsets.length = 0;
    this.pairOffsets.length = 0;
    this.starts.length = 0;
    this.sources = sources;
    this.identities.length = 0;

    let pairOffset = 0;
    for (const source of sources) {
      const buffers = source.buffers;
      this.starts.push(this.labels.length);
      let maxPair = 0;
      for (const label of buffers.labels) {
        const pairId = /** @type {any} */ (label).pairId;
        if (pairId !== undefined) {
          maxPair = Math.max(maxPair, pairId);
        }
        this.labels.push(label);
        this.glyphs.push(buffers.glyphs);
        this.worldOffsets.push(source.worldOffset);
        this.pairOffsets.push(pairOffset);
      }
      pairOffset += maxPair + 1;
    }
  }

  /**
   * @return {number} Label count.
   */
  getCount() {
    return this.labels.length;
  }

  /**
   * @param {Array<number>} identities Persistent ids aligned with labels.
   */
  setIdentities(identities) {
    this.identities = identities;
  }

  /**
   * Screen-space boxes for the declutter pass, in CSS pixels.
   *
   * The boxes are reused between passes, since only their numbers change.
   *
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @return {Array<import("../../render/webgpu/declutter.js").Label>} Boxes.
   */
  toScreen(frameState) {
    const transform = frameState.coordinateToPixelTransform;
    const boxes = this.boxes_;
    boxes.length = this.labels.length;
    for (let i = 0; i < this.labels.length; ++i) {
      const label = this.labels[i];
      const extra = /** @type {any} */ (label);
      const offset = this.worldOffsets[i];
      let box = boxes[i];
      if (!box) {
        box = /** @type {any} */ ({});
        boxes[i] = box;
      }
      box.priority = label.priority;
      box.sequence = label.sequence;
      box.id = this.identities[i] ?? label.id;
      box.mode = label.mode;
      box.pairId =
        extra.pairId === undefined
          ? undefined
          : extra.pairId + this.pairOffsets[i];
      box.padding = label.padding;
      box.glyphStart = label.glyphStart;
      box.glyphCount = label.glyphCount;

      const anchor =
        /** @type {import("../../coordinate.js").Coordinate|undefined} */ (
          extra._anchor
        );
      if (label.glyphCount) {
        const glyphs = this.glyphs[i];
        const bounds = [Infinity, Infinity, -Infinity, -Infinity];
        for (let g = 0; g < label.glyphCount; ++g) {
          const glyph = glyphs[(label.glyphStart || 0) + g];
          const x = glyph.x + offset;
          const pixelX =
            transform[0] * x + transform[2] * glyph.y + transform[4];
          const pixelY =
            transform[1] * x + transform[3] * glyph.y + transform[5];
          extendGlyphBounds(bounds, glyph, pixelX, pixelY);
        }
        box.minX = bounds[0];
        box.minY = bounds[1];
        box.maxX = bounds[2];
        box.maxY = bounds[3];
        inflateBox(box, label.padding, LABEL_COLLISION_MARGIN);
      } else if (anchor) {
        const x = anchor[0] + offset;
        const pixelX =
          transform[0] * x + transform[2] * anchor[1] + transform[4];
        const pixelY =
          transform[1] * x + transform[3] * anchor[1] + transform[5];
        box.minX = pixelX + label.minX;
        box.minY = pixelY + label.minY;
        box.maxX = pixelX + label.maxX;
        box.maxY = pixelY + label.maxY;
        inflateBox(box, undefined, LABEL_COLLISION_MARGIN);
      } else {
        box.minX = label.minX;
        box.minY = label.minY;
        box.maxX = label.maxX;
        box.maxY = label.maxY;
        inflateBox(box, label.padding, LABEL_COLLISION_MARGIN);
      }
    }
    return boxes;
  }
}

export default LabelView;
