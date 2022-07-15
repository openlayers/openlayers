/**
 * @module ol/render/canvas/BuilderGroup
 */

import Builder from './Builder.js';
import ImageBuilder from './ImageBuilder.js';
import LineStringBuilder from './LineStringBuilder.js';
import PolygonBuilder from './PolygonBuilder.js';
import TextBuilder from './TextBuilder.js';

/**
 * @type {Object<import("../canvas.js").BuilderType, typeof Builder>}
 */
const BATCH_CONSTRUCTORS = {
  'Circle': PolygonBuilder,
  'Default': Builder,
  'Image': ImageBuilder,
  'LineString': LineStringBuilder,
  'Polygon': PolygonBuilder,
  'Text': TextBuilder,
};

class BuilderGroup {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Max extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   */
  constructor(tolerance, maxExtent, resolution, pixelRatio) {
    /**
     * @private
     * @type {number}
     */
    this.tolerance_ = tolerance;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.maxExtent_ = maxExtent;

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ = pixelRatio;

    /**
     * @private
     * @type {number}
     */
    this.resolution_ = resolution;

    /**
     * @private
     * @type {!Object<string, !Object<import("../canvas.js").BuilderType, Builder>>}
     */
    this.buildersByZIndex_ = {};
  }

  /**
   * @return {!Object<string, !Object<import("../canvas.js").BuilderType, import("./Builder.js").SerializableInstructions>>} The serializable instructions
   */
  finish() {
    const builderInstructions = {};
    for (const zKey in this.buildersByZIndex_) {
      builderInstructions[zKey] = builderInstructions[zKey] || {};
      const builders = this.buildersByZIndex_[zKey];
      for (const builderKey in builders) {
        const builderInstruction = builders[builderKey].finish();
        builderInstructions[zKey][builderKey] = builderInstruction;
      }
    }
    return builderInstructions;
  }

  /**
   * @param {number|undefined} zIndex Z index.
   * @param {import("../canvas.js").BuilderType} builderType Replay type.
   * @return {import("../VectorContext.js").default} Replay.
   */
  getBuilder(zIndex, builderType) {
    const zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
    let replays = this.buildersByZIndex_[zIndexKey];
    if (replays === undefined) {
      replays = {};
      this.buildersByZIndex_[zIndexKey] = replays;
    }
    let replay = replays[builderType];
    if (replay === undefined) {
      const Constructor = BATCH_CONSTRUCTORS[builderType];
      replay = new Constructor(
        this.tolerance_,
        this.maxExtent_,
        this.resolution_,
        this.pixelRatio_
      );
      replays[builderType] = replay;
    }
    return replay;
  }
}

export default BuilderGroup;
