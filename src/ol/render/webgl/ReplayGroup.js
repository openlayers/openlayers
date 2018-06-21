/**
 * @module ol/render/webgl/ReplayGroup
 */
import {inherits} from '../../util.js';
import {numberSafeCompareFunction} from '../../array.js';
import {buffer, createOrUpdateFromCoordinate} from '../../extent.js';
import {isEmpty} from '../../obj.js';
import {ORDER} from '../replay.js';
import ReplayGroup from '../ReplayGroup.js';
import WebGLCircleReplay from '../webgl/CircleReplay.js';
import WebGLImageReplay from '../webgl/ImageReplay.js';
import WebGLLineStringReplay from '../webgl/LineStringReplay.js';
import WebGLPolygonReplay from '../webgl/PolygonReplay.js';
import WebGLTextReplay from '../webgl/TextReplay.js';

/**
 * @type {Array.<number>}
 */
const HIT_DETECTION_SIZE = [1, 1];

/**
 * @type {Object.<module:ol/render/ReplayType,
 *                function(new: module:ol/render/webgl/Replay, number,
 *                module:ol/extent~Extent)>}
 */
const BATCH_CONSTRUCTORS = {
  'Circle': WebGLCircleReplay,
  'Image': WebGLImageReplay,
  'LineString': WebGLLineStringReplay,
  'Polygon': WebGLPolygonReplay,
  'Text': WebGLTextReplay
};


/**
 * @constructor
 * @extends {module:ol/render/ReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {module:ol/extent~Extent} maxExtent Max extent.
 * @param {number=} opt_renderBuffer Render buffer.
 * @struct
 */
const WebGLReplayGroup = function(tolerance, maxExtent, opt_renderBuffer) {
  ReplayGroup.call(this);

  /**
   * @type {module:ol/extent~Extent}
   * @private
   */
  this.maxExtent_ = maxExtent;

  /**
   * @type {number}
   * @private
   */
  this.tolerance_ = tolerance;

  /**
   * @type {number|undefined}
   * @private
   */
  this.renderBuffer_ = opt_renderBuffer;

  /**
   * @private
   * @type {!Object.<string,
   *        Object.<module:ol/render/ReplayType, module:ol/render/webgl/Replay>>}
   */
  this.replaysByZIndex_ = {};

};

inherits(WebGLReplayGroup, ReplayGroup);


/**
 * @param {module:ol/style/Style} style Style.
 * @param {boolean} group Group with previous replay.
 */
WebGLReplayGroup.prototype.addDeclutter = function(style, group) {};


/**
 * @param {module:ol/webgl/Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
WebGLReplayGroup.prototype.getDeleteResourcesFunction = function(context) {
  const functions = [];
  let zKey;
  for (zKey in this.replaysByZIndex_) {
    const replays = this.replaysByZIndex_[zKey];
    for (const replayKey in replays) {
      functions.push(
        replays[replayKey].getDeleteResourcesFunction(context));
    }
  }
  return function() {
    const length = functions.length;
    let result;
    for (let i = 0; i < length; i++) {
      result = functions[i].apply(this, arguments);
    }
    return result;
  };
};


/**
 * @param {module:ol/webgl/Context} context Context.
 */
WebGLReplayGroup.prototype.finish = function(context) {
  let zKey;
  for (zKey in this.replaysByZIndex_) {
    const replays = this.replaysByZIndex_[zKey];
    for (const replayKey in replays) {
      replays[replayKey].finish(context);
    }
  }
};


/**
 * @inheritDoc
 */
WebGLReplayGroup.prototype.getReplay = function(zIndex, replayType) {
  const zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
  let replays = this.replaysByZIndex_[zIndexKey];
  if (replays === undefined) {
    replays = {};
    this.replaysByZIndex_[zIndexKey] = replays;
  }
  let replay = replays[replayType];
  if (replay === undefined) {
    /**
     * @type {Function}
     */
    const Constructor = BATCH_CONSTRUCTORS[replayType];
    replay = new Constructor(this.tolerance_, this.maxExtent_);
    replays[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
WebGLReplayGroup.prototype.isEmpty = function() {
  return isEmpty(this.replaysByZIndex_);
};


/**
 * @param {module:ol/webgl/Context} context Context.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {module:ol/size~Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features to skip.
 */
WebGLReplayGroup.prototype.replay = function(context,
  center, resolution, rotation, size, pixelRatio,
  opacity, skippedFeaturesHash) {
  /** @type {Array.<number>} */
  const zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(numberSafeCompareFunction);

  let i, ii, j, jj, replays, replay;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = 0, jj = ORDER.length; j < jj; ++j) {
      replay = replays[ORDER[j]];
      if (replay !== undefined) {
        replay.replay(context,
          center, resolution, rotation, size, pixelRatio,
          opacity, skippedFeaturesHash,
          undefined, false);
      }
    }
  }
};


/**
 * @private
 * @param {module:ol/webgl/Context} context Context.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {module:ol/size~Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features to skip.
 * @param {function((module:ol/Feature|module:ol/render/Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {module:ol/extent~Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplayGroup.prototype.replayHitDetection_ = function(context,
  center, resolution, rotation, size, pixelRatio, opacity,
  skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent) {
  /** @type {Array.<number>} */
  const zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(function(a, b) {
    return b - a;
  });

  let i, ii, j, replays, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = ORDER.length - 1; j >= 0; --j) {
      replay = replays[ORDER[j]];
      if (replay !== undefined) {
        result = replay.replay(context,
          center, resolution, rotation, size, pixelRatio, opacity,
          skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
};


/**
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {module:ol/webgl/Context} context Context.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {module:ol/size~Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features to skip.
 * @param {function((module:ol/Feature|module:ol/render/Feature)): T|undefined} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplayGroup.prototype.forEachFeatureAtCoordinate = function(
  coordinate, context, center, resolution, rotation, size, pixelRatio,
  opacity, skippedFeaturesHash,
  callback) {
  const gl = context.getGL();
  gl.bindFramebuffer(
    gl.FRAMEBUFFER, context.getHitDetectionFramebuffer());


  /**
   * @type {module:ol/extent~Extent}
   */
  let hitExtent;
  if (this.renderBuffer_ !== undefined) {
    // build an extent around the coordinate, so that only features that
    // intersect this extent are checked
    hitExtent = buffer(createOrUpdateFromCoordinate(coordinate), resolution * this.renderBuffer_);
  }

  return this.replayHitDetection_(context,
    coordinate, resolution, rotation, HIT_DETECTION_SIZE,
    pixelRatio, opacity, skippedFeaturesHash,
    /**
     * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
     * @return {?} Callback result.
     */
    function(feature) {
      const imageData = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

      if (imageData[3] > 0) {
        const result = callback(feature);
        if (result) {
          return result;
        }
      }
    }, true, hitExtent);
};


/**
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @param {module:ol/webgl/Context} context Context.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {module:ol/size~Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features to skip.
 * @return {boolean} Is there a feature at the given coordinate?
 */
WebGLReplayGroup.prototype.hasFeatureAtCoordinate = function(
  coordinate, context, center, resolution, rotation, size, pixelRatio,
  opacity, skippedFeaturesHash) {
  const gl = context.getGL();
  gl.bindFramebuffer(
    gl.FRAMEBUFFER, context.getHitDetectionFramebuffer());

  const hasFeature = this.replayHitDetection_(context,
    coordinate, resolution, rotation, HIT_DETECTION_SIZE,
    pixelRatio, opacity, skippedFeaturesHash,
    /**
     * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
     * @return {boolean} Is there a feature?
     */
    function(feature) {
      const imageData = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
      return imageData[3] > 0;
    }, false);

  return hasFeature !== undefined;
};

export default WebGLReplayGroup;
