/**
 * @module ol/render/canvas/ReplayGroup
 */

import {numberSafeCompareFunction} from '../../array.js';
import {createCanvasContext2D} from '../../dom.js';
import {buffer, createEmpty, extendCoordinate} from '../../extent.js';
import {transform2D} from '../../geom/flat/transform.js';
import {isEmpty} from '../../obj.js';
import ReplayGroup from '../ReplayGroup.js';
import ReplayType from '../ReplayType.js';
import CanvasReplay from './Replay.js';
import CanvasImageReplay from './ImageReplay.js';
import CanvasLineStringReplay from './LineStringReplay.js';
import CanvasPolygonReplay from './PolygonReplay.js';
import CanvasTextReplay from './TextReplay.js';
import {ORDER} from '../replay.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';


/**
 * @type {Object<ReplayType, typeof CanvasReplay>}
 */
const BATCH_CONSTRUCTORS = {
  'Circle': CanvasPolygonReplay,
  'Default': CanvasReplay,
  'Image': CanvasImageReplay,
  'LineString': CanvasLineStringReplay,
  'Polygon': CanvasPolygonReplay,
  'Text': CanvasTextReplay
};


class CanvasReplayGroup extends ReplayGroup {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Max extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {boolean} overlaps The replay group can have overlapping geometries.
   * @param {?} declutterTree Declutter tree for declutter processing in postrender.
   * @param {number=} opt_renderBuffer Optional rendering buffer.
   */
  constructor(
    tolerance,
    maxExtent,
    resolution,
    pixelRatio,
    overlaps,
    declutterTree,
    opt_renderBuffer
  ) {
    super();

    /**
     * Declutter tree.
     * @private
     */
    this.declutterTree_ = declutterTree;

    /**
     * @type {import("../canvas.js").DeclutterGroup}
     * @private
     */
    this.declutterGroup_ = null;

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
     * @type {!Object<string, !Object<ReplayType, CanvasReplay>>}
     */
    this.replaysByZIndex_ = {};

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
  }

  /**
   * @inheritDoc
   */
  addDeclutter(group) {
    let declutter = null;
    if (this.declutterTree_) {
      if (group) {
        declutter = this.declutterGroup_;
        /** @type {number} */ (declutter[4])++;
      } else {
        declutter = this.declutterGroup_ = createEmpty();
        declutter.push(1);
      }
    }
    return declutter;
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
   * @param {Array<ReplayType>} replays Replays.
   * @return {boolean} Has replays of the provided types.
   */
  hasReplays(replays) {
    for (const zIndex in this.replaysByZIndex_) {
      const candidates = this.replaysByZIndex_[zIndex];
      for (let i = 0, ii = replays.length; i < ii; ++i) {
        if (replays[i] in candidates) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * FIXME empty description for jsdoc
   */
  finish() {
    for (const zKey in this.replaysByZIndex_) {
      const replays = this.replaysByZIndex_[zKey];
      for (const replayKey in replays) {
        replays[replayKey].finish();
      }
    }
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {number} rotation Rotation.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function((import("../../Feature.js").default|import("../Feature.js").default)): T} callback Feature callback.
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

    let replayType;

    /**
     * @param {import("../../Feature.js").default|import("../Feature.js").default} feature Feature.
     * @return {?} Callback result.
     */
    function featureCallback(feature) {
      const imageData = context.getImageData(0, 0, contextSize, contextSize).data;
      for (let i = 0; i < contextSize; i++) {
        for (let j = 0; j < contextSize; j++) {
          if (mask[i][j]) {
            if (imageData[(j * contextSize + i) * 4 + 3] > 0) {
              let result;
              if (!(declutteredFeatures && (replayType == ReplayType.IMAGE || replayType == ReplayType.TEXT)) ||
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
    const zs = Object.keys(this.replaysByZIndex_).map(Number);
    zs.sort(numberSafeCompareFunction);

    let i, j, replays, replay, result;
    for (i = zs.length - 1; i >= 0; --i) {
      const zIndexKey = zs[i].toString();
      replays = this.replaysByZIndex_[zIndexKey];
      for (j = ORDER.length - 1; j >= 0; --j) {
        replayType = ORDER[j];
        replay = replays[replayType];
        if (replay !== undefined) {
          if (declutterReplays &&
              (replayType == ReplayType.IMAGE || replayType == ReplayType.TEXT)) {
            const declutter = declutterReplays[zIndexKey];
            if (!declutter) {
              declutterReplays[zIndexKey] = [replay, transform.slice(0)];
            } else {
              declutter.push(replay, transform.slice(0));
            }
          } else {
            result = replay.replayHitDetection(context, transform, rotation,
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
   * @inheritDoc
   */
  getReplay(zIndex, replayType) {
    const zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
    let replays = this.replaysByZIndex_[zIndexKey];
    if (replays === undefined) {
      replays = {};
      this.replaysByZIndex_[zIndexKey] = replays;
    }
    let replay = replays[replayType];
    if (replay === undefined) {
      const Constructor = BATCH_CONSTRUCTORS[replayType];
      replay = new Constructor(this.tolerance_, this.maxExtent_,
        this.resolution_, this.pixelRatio_, this.overlaps_, this.declutterTree_);
      replays[replayType] = replay;
    }
    return replay;
  }

  /**
   * @return {Object<string, Object<ReplayType, CanvasReplay>>} Replays.
   */
  getReplays() {
    return this.replaysByZIndex_;
  }

  /**
   * @inheritDoc
   */
  isEmpty() {
    return isEmpty(this.replaysByZIndex_);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {boolean} snapToPixel Snap point symbols and test to integer pixel.
   * @param {Array<ReplayType>=} opt_replayTypes Ordered replay types to replay.
   *     Default is {@link module:ol/render/replay~ORDER}
   * @param {Object<string, import("../canvas.js").DeclutterGroup>=} opt_declutterReplays Declutter replays.
   */
  replay(
    context,
    transform,
    viewRotation,
    skippedFeaturesHash,
    snapToPixel,
    opt_replayTypes,
    opt_declutterReplays
  ) {

    /** @type {Array<number>} */
    const zs = Object.keys(this.replaysByZIndex_).map(Number);
    zs.sort(numberSafeCompareFunction);

    // setup clipping so that the parts of over-simplified geometries are not
    // visible outside the current extent when panning
    context.save();
    this.clip(context, transform);

    const replayTypes = opt_replayTypes ? opt_replayTypes : ORDER;
    let i, ii, j, jj, replays, replay;
    for (i = 0, ii = zs.length; i < ii; ++i) {
      const zIndexKey = zs[i].toString();
      replays = this.replaysByZIndex_[zIndexKey];
      for (j = 0, jj = replayTypes.length; j < jj; ++j) {
        const replayType = replayTypes[j];
        replay = replays[replayType];
        if (replay !== undefined) {
          if (opt_declutterReplays &&
              (replayType == ReplayType.IMAGE || replayType == ReplayType.TEXT)) {
            const declutter = opt_declutterReplays[zIndexKey];
            if (!declutter) {
              opt_declutterReplays[zIndexKey] = [replay, transform.slice(0)];
            } else {
              declutter.push(replay, transform.slice(0));
            }
          } else {
            replay.replay(context, transform, viewRotation, skippedFeaturesHash, snapToPixel);
          }
        }
      }
    }

    context.restore();
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
    const replayData = declutterReplays[zs[z].toString()];
    for (let i = 0, ii = replayData.length; i < ii;) {
      const replay = replayData[i++];
      const transform = replayData[i++];
      replay.replay(context, transform, rotation, skippedFeatureUids, snapToPixel);
    }
  }
}


export default CanvasReplayGroup;
