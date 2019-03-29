/**
 * @module ol/render/canvas/ExecutorGroup
 */

import {numberSafeCompareFunction} from '../../array.js';
import {createCanvasContext2D} from '../../dom.js';
import {buffer, createEmpty, extendCoordinate} from '../../extent.js';
import {transform2D} from '../../geom/flat/transform.js';
import {isEmpty} from '../../obj.js';
import BuilderType from './BuilderType.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';
import Executor from './Executor.js';
import Disposable from '../../Disposable.js';

/**
 * @const
 * @type {Array<BuilderType>}
 */
const ORDER = [
  BuilderType.POLYGON,
  BuilderType.CIRCLE,
  BuilderType.LINE_STRING,
  BuilderType.IMAGE,
  BuilderType.TEXT,
  BuilderType.DEFAULT
];


class ExecutorGroup extends Disposable {
  /**
   * @param {import("../../extent.js").Extent} maxExtent Max extent for clipping. When a
   * `maxExtent` was set on the Buillder for this executor group, the same `maxExtent`
   * should be set here, unless the target context does not exceet that extent (which
   * can be the case when rendering to tiles).
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {boolean} overlaps The executor group can have overlapping geometries.
   * @param {?} declutterTree Declutter tree for declutter processing in postrender.
   * @param {!Object<string, !Object<BuilderType, import("./Builder.js").SerializableInstructions>>} allInstructions
   * The serializable instructions.
   * @param {number=} opt_renderBuffer Optional rendering buffer.
   */
  constructor(maxExtent, resolution, pixelRatio, overlaps, declutterTree, allInstructions, opt_renderBuffer) {
    super();
    /**
     * Declutter tree.
     * @private
     */
    this.declutterTree_ = declutterTree;

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
    this.renderBuffer_ = opt_renderBuffer;

    /**
     * @private
     * @type {!Object<string, !Object<BuilderType, import("./Executor").default>>}
     */
    this.executorsByZIndex_ = {};

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.hitDetectionContext_ = createCanvasContext2D(1, 1);

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.hitDetectionTransform_ = createTransform();

    this.createExecutors_(allInstructions);
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
   * @param {!Object<string, !Object<BuilderType, import("./Builder.js").SerializableInstructions>>} allInstructions The serializable instructions
   */
  createExecutors_(allInstructions) {
    for (const zIndex in allInstructions) {
      let executors = this.executorsByZIndex_[zIndex];
      if (executors === undefined) {
        this.executorsByZIndex_[zIndex] = executors = {};
      }
      const instructionByZindex = allInstructions[zIndex];
      for (const builderType in instructionByZindex) {
        const instructions = instructionByZindex[builderType];
        executors[builderType] = new Executor(
          this.resolution_, this.pixelRatio_, this.overlaps_, this.declutterTree_, instructions);
      }
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    for (const z in this.executorsByZIndex_) {
      const executors = this.executorsByZIndex_[z];
      for (const key in executors) {
        executors[key].disposeInternal();
      }
    }
    const canvas = this.hitDetectionContext_.canvas;
    canvas.width = canvas.height = 0;
    super.disposeInternal();
  }

  /**
   * @param {Array<BuilderType>} executors Executors.
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
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function(import("../../Feature.js").FeatureLike): T} callback Feature callback.
   * @param {Object<string, import("../canvas.js").DeclutterGroup>} declutterReplays Declutter replays.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    resolution,
    rotation,
    hitTolerance,
    skippedFeaturesHash,
    callback,
    declutterReplays
  ) {

    hitTolerance = Math.round(hitTolerance);
    const contextSize = hitTolerance * 2 + 1;
    const transform = composeTransform(this.hitDetectionTransform_,
      hitTolerance + 0.5, hitTolerance + 0.5,
      1 / resolution, -1 / resolution,
      -rotation,
      -coordinate[0], -coordinate[1]);
    const context = this.hitDetectionContext_;

    if (context.canvas.width !== contextSize || context.canvas.height !== contextSize) {
      context.canvas.width = contextSize;
      context.canvas.height = contextSize;
    } else {
      context.clearRect(0, 0, contextSize, contextSize);
    }

    /**
     * @type {import("../../extent.js").Extent}
     */
    let hitExtent;
    if (this.renderBuffer_ !== undefined) {
      hitExtent = createEmpty();
      extendCoordinate(hitExtent, coordinate);
      buffer(hitExtent, resolution * (this.renderBuffer_ + hitTolerance), hitExtent);
    }

    const mask = getCircleArray(hitTolerance);
    let declutteredFeatures;
    if (this.declutterTree_) {
      declutteredFeatures = this.declutterTree_.all().map(function(entry) {
        return entry.value;
      });
    }

    let builderType;

    /**
     * @param {import("../../Feature.js").FeatureLike} feature Feature.
     * @return {?} Callback result.
     */
    function featureCallback(feature) {
      const imageData = context.getImageData(0, 0, contextSize, contextSize).data;
      for (let i = 0; i < contextSize; i++) {
        for (let j = 0; j < contextSize; j++) {
          if (mask[i][j]) {
            if (imageData[(j * contextSize + i) * 4 + 3] > 0) {
              let result;
              if (!(declutteredFeatures && (builderType == BuilderType.IMAGE || builderType == BuilderType.TEXT)) ||
                  declutteredFeatures.indexOf(feature) !== -1) {
                result = callback(feature);
              }
              if (result) {
                return result;
              } else {
                context.clearRect(0, 0, contextSize, contextSize);
                return undefined;
              }
            }
          }
        }
      }
    }

    /** @type {Array<number>} */
    const zs = Object.keys(this.executorsByZIndex_).map(Number);
    zs.sort(numberSafeCompareFunction);

    let i, j, executors, executor, result;
    for (i = zs.length - 1; i >= 0; --i) {
      const zIndexKey = zs[i].toString();
      executors = this.executorsByZIndex_[zIndexKey];
      for (j = ORDER.length - 1; j >= 0; --j) {
        builderType = ORDER[j];
        executor = executors[builderType];
        if (executor !== undefined) {
          if (declutterReplays &&
              (builderType == BuilderType.IMAGE || builderType == BuilderType.TEXT)) {
            const declutter = declutterReplays[zIndexKey];
            if (!declutter) {
              declutterReplays[zIndexKey] = [executor, transform.slice(0)];
            } else {
              declutter.push(executor, transform.slice(0));
            }
          } else {
            result = executor.executeHitDetection(context, transform, rotation,
              skippedFeaturesHash, featureCallback, hitExtent);
            if (result) {
              return result;
            }
          }
        }
      }
    }
    return undefined;
  }

  /**
   * @param {import("../../transform.js").Transform} transform Transform.
   * @return {Array<number>} Clip coordinates.
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
    transform2D(
      flatClipCoords, 0, 8, 2, transform, flatClipCoords);
    return flatClipCoords;
  }

  /**
   * @return {boolean} Is empty.
   */
  isEmpty() {
    return isEmpty(this.executorsByZIndex_);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {boolean} snapToPixel Snap point symbols and test to integer pixel.
   * @param {Array<BuilderType>=} opt_builderTypes Ordered replay types to replay.
   *     Default is {@link module:ol/render/replay~ORDER}
   * @param {Object<string, import("../canvas.js").DeclutterGroup>=} opt_declutterReplays Declutter replays.
   */
  execute(context, transform, viewRotation, skippedFeaturesHash, snapToPixel, opt_builderTypes,
    opt_declutterReplays) {

    /** @type {Array<number>} */
    const zs = Object.keys(this.executorsByZIndex_).map(Number);
    zs.sort(numberSafeCompareFunction);

    // setup clipping so that the parts of over-simplified geometries are not
    // visible outside the current extent when panning
    if (this.maxExtent_) {
      context.save();
      this.clip(context, transform);
    }

    const builderTypes = opt_builderTypes ? opt_builderTypes : ORDER;
    let i, ii, j, jj, replays, replay;
    for (i = 0, ii = zs.length; i < ii; ++i) {
      const zIndexKey = zs[i].toString();
      replays = this.executorsByZIndex_[zIndexKey];
      for (j = 0, jj = builderTypes.length; j < jj; ++j) {
        const builderType = builderTypes[j];
        replay = replays[builderType];
        if (replay !== undefined) {
          if (opt_declutterReplays &&
              (builderType == BuilderType.IMAGE || builderType == BuilderType.TEXT)) {
            const declutter = opt_declutterReplays[zIndexKey];
            if (!declutter) {
              opt_declutterReplays[zIndexKey] = [replay, transform.slice(0)];
            } else {
              declutter.push(replay, transform.slice(0));
            }
          } else {
            replay.execute(context, transform, viewRotation, skippedFeaturesHash, snapToPixel);
          }
        }
      }
    }

    if (this.maxExtent_) {
      context.restore();
    }
  }
}


/**
 * This cache is used for storing calculated pixel circles for increasing performance.
 * It is a static property to allow each Replaygroup to access it.
 * @type {Object<number, Array<Array<(boolean|undefined)>>>}
 */
const circleArrayCache = {
  0: [[true]]
};


/**
 * This method fills a row in the array from the given coordinate to the
 * middle with `true`.
 * @param {Array<Array<(boolean|undefined)>>} array The array that will be altered.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 */
function fillCircleArrayRowToMiddle(array, x, y) {
  let i;
  const radius = Math.floor(array.length / 2);
  if (x >= radius) {
    for (i = radius; i < x; i++) {
      array[i][y] = true;
    }
  } else if (x < radius) {
    for (i = x + 1; i < radius; i++) {
      array[i][y] = true;
    }
  }
}


/**
 * This methods creates a circle inside a fitting array. Points inside the
 * circle are marked by true, points on the outside are undefined.
 * It uses the midpoint circle algorithm.
 * A cache is used to increase performance.
 * @param {number} radius Radius.
 * @returns {Array<Array<(boolean|undefined)>>} An array with marked circle points.
 */
export function getCircleArray(radius) {
  if (circleArrayCache[radius] !== undefined) {
    return circleArrayCache[radius];
  }

  const arraySize = radius * 2 + 1;
  const arr = new Array(arraySize);
  for (let i = 0; i < arraySize; i++) {
    arr[i] = new Array(arraySize);
  }

  let x = radius;
  let y = 0;
  let error = 0;

  while (x >= y) {
    fillCircleArrayRowToMiddle(arr, radius + x, radius + y);
    fillCircleArrayRowToMiddle(arr, radius + y, radius + x);
    fillCircleArrayRowToMiddle(arr, radius - y, radius + x);
    fillCircleArrayRowToMiddle(arr, radius - x, radius + y);
    fillCircleArrayRowToMiddle(arr, radius - x, radius - y);
    fillCircleArrayRowToMiddle(arr, radius - y, radius - x);
    fillCircleArrayRowToMiddle(arr, radius + y, radius - x);
    fillCircleArrayRowToMiddle(arr, radius + x, radius - y);

    y++;
    error += 1 + 2 * y;
    if (2 * (error - x) + 1 > 0) {
      x -= 1;
      error += 1 - 2 * x;
    }
  }

  circleArrayCache[radius] = arr;
  return arr;
}


/**
 * @param {!Object<string, Array<*>>} declutterReplays Declutter replays.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
 */
export function replayDeclutter(declutterReplays, context, rotation, snapToPixel) {
  const zs = Object.keys(declutterReplays).map(Number).sort(numberSafeCompareFunction);
  const skippedFeatureUids = {};
  for (let z = 0, zz = zs.length; z < zz; ++z) {
    const executorData = declutterReplays[zs[z].toString()];
    for (let i = 0, ii = executorData.length; i < ii;) {
      const executor = executorData[i++];
      const transform = executorData[i++];
      executor.execute(context, transform, rotation, skippedFeatureUids, snapToPixel);
    }
  }
}


export default ExecutorGroup;
