/**
 * @module ol/render/canvas/ExecutorGroup
 */

import Executor from './Executor.js';
import {ascending} from '../../array.js';
import {buffer, createEmpty, extendCoordinate} from '../../extent.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../transform.js';
import {createCanvasContext2D} from '../../dom.js';
import {isEmpty} from '../../obj.js';
import {transform2D} from '../../geom/flat/transform.js';

/**
 * @const
 * @type {Array<import("../canvas.js").BuilderType>}
 */
export const ALL = [
  'Polygon',
  'Circle',
  'LineString',
  'Image',
  'Text',
  'Default',
];

/**
 * @const
 * @type {Array<import("../canvas.js").BuilderType>}
 */
export const DECLUTTER = ['Image', 'Text'];

/**
 * @const
 * @type {Array<import("../canvas.js").BuilderType>}
 */
export const NON_DECLUTTER = ALL.filter(
  (builderType) => !DECLUTTER.includes(builderType),
);

class ExecutorGroup {
  /**
   * @param {import("../../extent.js").Extent} maxExtent Max extent for clipping. When a
   * `maxExtent` was set on the Builder for this executor group, the same `maxExtent`
   * should be set here, unless the target context does not exceed that extent (which
   * can be the case when rendering to tiles).
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {boolean} overlaps The executor group can have overlapping geometries.
   * @param {!Object<string, !Object<import("../canvas.js").BuilderType, import("../canvas.js").SerializableInstructions>>} allInstructions
   * The serializable instructions.
   * @param {number} [renderBuffer] Optional rendering buffer.
   * @param {boolean} [deferredRendering] Enable deferred rendering with renderDeferred().
   */
  constructor(
    maxExtent,
    resolution,
    pixelRatio,
    overlaps,
    allInstructions,
    renderBuffer,
    deferredRendering,
  ) {
    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.maxExtent_ = maxExtent;

    /**
     * @private
     * @type {boolean}
     */
    this.overlaps_ = overlaps;

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
     * @type {number|undefined}
     */
    this.renderBuffer_ = renderBuffer;

    /**
     * @private
     * @type {!Object<string, !Object<string, import("./Executor").default>>}
     */
    this.executorsByZIndex_ = {};

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.hitDetectionContext_ = null;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.hitDetectionTransform_ = createTransform();

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.renderedContext_ = null;

    /**
     * @private
     * @type {Object<number, Array<import("./ZIndexContext.js").default>>}
     */
    this.deferredZIndexContexts_ = {};

    this.createExecutors_(allInstructions, deferredRendering);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   */
  clip(context, transform) {
    const flatClipCoords = this.getClipCoords(transform);
    context.beginPath();
    context.moveTo(flatClipCoords[0], flatClipCoords[1]);
    context.lineTo(flatClipCoords[2], flatClipCoords[3]);
    context.lineTo(flatClipCoords[4], flatClipCoords[5]);
    context.lineTo(flatClipCoords[6], flatClipCoords[7]);
    context.clip();
  }

  /**
   * Create executors and populate them using the provided instructions.
   * @private
   * @param {!Object<string, !Object<string, import("../canvas.js").SerializableInstructions>>} allInstructions The serializable instructions
   * @param {boolean} deferredRendering Enable deferred rendering.
   */
  createExecutors_(allInstructions, deferredRendering) {
    for (const zIndex in allInstructions) {
      let executors = this.executorsByZIndex_[zIndex];
      if (executors === undefined) {
        executors = {};
        this.executorsByZIndex_[zIndex] = executors;
      }
      const instructionByZindex = allInstructions[zIndex];
      for (const builderType in instructionByZindex) {
        const instructions = instructionByZindex[builderType];
        executors[builderType] = new Executor(
          this.resolution_,
          this.pixelRatio_,
          this.overlaps_,
          instructions,
          deferredRendering,
        );
      }
    }
  }

  /**
   * @param {Array<import("../canvas.js").BuilderType>} executors Executors.
   * @return {boolean} Has executors of the provided types.
   */
  hasExecutors(executors) {
    for (const zIndex in this.executorsByZIndex_) {
      const candidates = this.executorsByZIndex_[zIndex];
      for (let i = 0, ii = executors.length; i < ii; ++i) {
        if (executors[i] in candidates) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {number} rotation Rotation.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(import("../../Feature.js").FeatureLike, import("../../geom/SimpleGeometry.js").default, number): T} callback Feature callback.
   * @param {Array<import("../../Feature.js").FeatureLike>} declutteredFeatures Decluttered features.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    resolution,
    rotation,
    hitTolerance,
    callback,
    declutteredFeatures,
  ) {
    hitTolerance = Math.round(hitTolerance);
    const contextSize = hitTolerance * 2 + 1;
    const transform = composeTransform(
      this.hitDetectionTransform_,
      hitTolerance + 0.5,
      hitTolerance + 0.5,
      1 / resolution,
      -1 / resolution,
      -rotation,
      -coordinate[0],
      -coordinate[1],
    );

    const newContext = !this.hitDetectionContext_;
    if (newContext) {
      this.hitDetectionContext_ = createCanvasContext2D(
        contextSize,
        contextSize,
        undefined,
        {willReadFrequently: true},
      );
    }
    const context = this.hitDetectionContext_;

    if (
      context.canvas.width !== contextSize ||
      context.canvas.height !== contextSize
    ) {
      context.canvas.width = contextSize;
      context.canvas.height = contextSize;
    } else if (!newContext) {
      context.clearRect(0, 0, contextSize, contextSize);
    }

    /**
     * @type {import("../../extent.js").Extent}
     */
    let hitExtent;
    if (this.renderBuffer_ !== undefined) {
      hitExtent = createEmpty();
      extendCoordinate(hitExtent, coordinate);
      buffer(
        hitExtent,
        resolution * (this.renderBuffer_ + hitTolerance),
        hitExtent,
      );
    }

    const indexes = getPixelIndexArray(hitTolerance);

    let builderType;

    /**
     * @param {import("../../Feature.js").FeatureLike} feature Feature.
     * @param {import("../../geom/SimpleGeometry.js").default} geometry Geometry.
     * @param {import('../../style/Style.js').DeclutterMode} declutterMode Declutter mode.
     * @return {T|undefined} Callback result.
     */
    function featureCallback(feature, geometry, declutterMode) {
      const imageData = context.getImageData(
        0,
        0,
        contextSize,
        contextSize,
      ).data;
      for (let i = 0, ii = indexes.length; i < ii; i++) {
        if (imageData[indexes[i]] > 0) {
          if (
            !declutteredFeatures ||
            declutterMode === 'none' ||
            (builderType !== 'Image' && builderType !== 'Text') ||
            declutteredFeatures.includes(feature)
          ) {
            const idx = (indexes[i] - 3) / 4;
            const x = hitTolerance - (idx % contextSize);
            const y = hitTolerance - ((idx / contextSize) | 0);
            const result = callback(feature, geometry, x * x + y * y);
            if (result) {
              return result;
            }
          }
          context.clearRect(0, 0, contextSize, contextSize);
          break;
        }
      }
      return undefined;
    }

    /** @type {Array<number>} */
    const zs = Object.keys(this.executorsByZIndex_).map(Number);
    zs.sort(ascending);

    let i, j, executors, executor, result;
    for (i = zs.length - 1; i >= 0; --i) {
      const zIndexKey = zs[i].toString();
      executors = this.executorsByZIndex_[zIndexKey];
      for (j = ALL.length - 1; j >= 0; --j) {
        builderType = ALL[j];
        executor = executors[builderType];
        if (executor !== undefined) {
          result = executor.executeHitDetection(
            context,
            transform,
            rotation,
            featureCallback,
            hitExtent,
          );
          if (result) {
            return result;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * @param {import("../../transform.js").Transform} transform Transform.
   * @return {Array<number>|null} Clip coordinates.
   */
  getClipCoords(transform) {
    const maxExtent = this.maxExtent_;
    if (!maxExtent) {
      return null;
    }
    const minX = maxExtent[0];
    const minY = maxExtent[1];
    const maxX = maxExtent[2];
    const maxY = maxExtent[3];
    const flatClipCoords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY];
    transform2D(flatClipCoords, 0, 8, 2, transform, flatClipCoords);
    return flatClipCoords;
  }

  /**
   * @return {boolean} Is empty.
   */
  isEmpty() {
    return isEmpty(this.executorsByZIndex_);
  }

  /**
   * @param {CanvasRenderingContext2D} targetContext Context.
   * @param {import('../../size.js').Size} scaledCanvasSize Scale of the context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {boolean} snapToPixel Snap point symbols and test to integer pixel.
   * @param {Array<import("../canvas.js").BuilderType>} [builderTypes] Ordered replay types to replay.
   *     Default is {@link module:ol/render/replay~ALL}
   * @param {import("rbush").default<import('./Executor.js').DeclutterEntry>|null} [declutterTree] Declutter tree.
   *     When set to null, no decluttering is done, even when the executor group has a `ZIndexContext`.
   */
  execute(
    targetContext,
    scaledCanvasSize,
    transform,
    viewRotation,
    snapToPixel,
    builderTypes,
    declutterTree,
  ) {
    /** @type {Array<number>} */
    const zs = Object.keys(this.executorsByZIndex_).map(Number);
    zs.sort(ascending);

    builderTypes = builderTypes ? builderTypes : ALL;
    const maxBuilderTypes = ALL.length;
    let i, ii, j, jj, replays;
    if (declutterTree) {
      zs.reverse();
    }
    for (i = 0, ii = zs.length; i < ii; ++i) {
      const zIndexKey = zs[i].toString();
      replays = this.executorsByZIndex_[zIndexKey];
      for (j = 0, jj = builderTypes.length; j < jj; ++j) {
        const builderType = builderTypes[j];
        const replay = replays[builderType];
        if (replay !== undefined) {
          const zIndexContext =
            declutterTree === null ? undefined : replay.getZIndexContext();
          const context = zIndexContext
            ? zIndexContext.getContext()
            : targetContext;
          const requireClip =
            this.maxExtent_ &&
            builderType !== 'Image' &&
            builderType !== 'Text';
          if (requireClip) {
            context.save();
            // setup clipping so that the parts of over-simplified geometries are not
            // visible outside the current extent when panning
            this.clip(context, transform);
          }
          if (
            !zIndexContext ||
            builderType === 'Text' ||
            builderType === 'Image'
          ) {
            replay.execute(
              context,
              scaledCanvasSize,
              transform,
              viewRotation,
              snapToPixel,
              declutterTree,
            );
          } else {
            zIndexContext.pushFunction((context) =>
              replay.execute(
                context,
                scaledCanvasSize,
                transform,
                viewRotation,
                snapToPixel,
                declutterTree,
              ),
            );
          }
          if (requireClip) {
            context.restore();
          }
          if (zIndexContext) {
            zIndexContext.offset();
            const index = zs[i] * maxBuilderTypes + j;
            if (!this.deferredZIndexContexts_[index]) {
              this.deferredZIndexContexts_[index] = [];
            }
            this.deferredZIndexContexts_[index].push(zIndexContext);
          }
        }
      }
    }

    this.renderedContext_ = targetContext;
  }

  getDeferredZIndexContexts() {
    return this.deferredZIndexContexts_;
  }

  getRenderedContext() {
    return this.renderedContext_;
  }

  renderDeferred() {
    const deferredZIndexContexts = this.deferredZIndexContexts_;
    const zs = Object.keys(deferredZIndexContexts).map(Number).sort(ascending);
    for (let i = 0, ii = zs.length; i < ii; ++i) {
      deferredZIndexContexts[zs[i]].forEach((zIndexContext) => {
        zIndexContext.draw(this.renderedContext_); // FIXME Pass clip to replay for temporarily enabling clip
        zIndexContext.clear();
      });
      deferredZIndexContexts[zs[i]].length = 0;
    }
  }
}

/**
 * This cache is used to store arrays of indexes for calculated pixel circles
 * to increase performance.
 * It is a static property to allow each Replaygroup to access it.
 * @type {Object<number, Array<number>>}
 */
const circlePixelIndexArrayCache = {};

/**
 * This methods creates an array with indexes of all pixels within a circle,
 * ordered by how close they are to the center.
 * A cache is used to increase performance.
 * @param {number} radius Radius.
 * @return {Array<number>} An array with indexes within a circle.
 */
export function getPixelIndexArray(radius) {
  if (circlePixelIndexArrayCache[radius] !== undefined) {
    return circlePixelIndexArrayCache[radius];
  }

  const size = radius * 2 + 1;
  const maxDistanceSq = radius * radius;
  const distances = new Array(maxDistanceSq + 1);
  for (let i = 0; i <= radius; ++i) {
    for (let j = 0; j <= radius; ++j) {
      const distanceSq = i * i + j * j;
      if (distanceSq > maxDistanceSq) {
        break;
      }
      let distance = distances[distanceSq];
      if (!distance) {
        distance = [];
        distances[distanceSq] = distance;
      }
      distance.push(((radius + i) * size + (radius + j)) * 4 + 3);
      if (i > 0) {
        distance.push(((radius - i) * size + (radius + j)) * 4 + 3);
      }
      if (j > 0) {
        distance.push(((radius + i) * size + (radius - j)) * 4 + 3);
        if (i > 0) {
          distance.push(((radius - i) * size + (radius - j)) * 4 + 3);
        }
      }
    }
  }

  const pixelIndex = [];
  for (let i = 0, ii = distances.length; i < ii; ++i) {
    if (distances[i]) {
      pixelIndex.push(...distances[i]);
    }
  }

  circlePixelIndexArrayCache[radius] = pixelIndex;
  return pixelIndex;
}

export default ExecutorGroup;
