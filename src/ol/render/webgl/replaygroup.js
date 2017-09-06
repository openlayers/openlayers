import _ol_ from '../../index';
import _ol_array_ from '../../array';
import _ol_extent_ from '../../extent';
import _ol_obj_ from '../../obj';
import _ol_render_replay_ from '../replay';
import _ol_render_ReplayGroup_ from '../replaygroup';
import _ol_render_webgl_CircleReplay_ from '../webgl/circlereplay';
import _ol_render_webgl_ImageReplay_ from '../webgl/imagereplay';
import _ol_render_webgl_LineStringReplay_ from '../webgl/linestringreplay';
import _ol_render_webgl_PolygonReplay_ from '../webgl/polygonreplay';
import _ol_render_webgl_TextReplay_ from '../webgl/textreplay';

/**
 * @constructor
 * @extends {ol.render.ReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @param {number=} opt_renderBuffer Render buffer.
 * @struct
 */
var _ol_render_webgl_ReplayGroup_ = function(tolerance, maxExtent, opt_renderBuffer) {
  _ol_render_ReplayGroup_.call(this);

  /**
   * @type {ol.Extent}
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
   *        Object.<ol.render.ReplayType, ol.render.webgl.Replay>>}
   */
  this.replaysByZIndex_ = {};

};

_ol_.inherits(_ol_render_webgl_ReplayGroup_, _ol_render_ReplayGroup_);


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
_ol_render_webgl_ReplayGroup_.prototype.getDeleteResourcesFunction = function(context) {
  var functions = [];
  var zKey;
  for (zKey in this.replaysByZIndex_) {
    var replays = this.replaysByZIndex_[zKey];
    var replayKey;
    for (replayKey in replays) {
      functions.push(
          replays[replayKey].getDeleteResourcesFunction(context));
    }
  }
  return function() {
    var length = functions.length;
    var result;
    for (var i = 0; i < length; i++) {
      result = functions[i].apply(this, arguments);
    }
    return result;
  };
};


/**
 * @param {ol.webgl.Context} context Context.
 */
_ol_render_webgl_ReplayGroup_.prototype.finish = function(context) {
  var zKey;
  for (zKey in this.replaysByZIndex_) {
    var replays = this.replaysByZIndex_[zKey];
    var replayKey;
    for (replayKey in replays) {
      replays[replayKey].finish(context);
    }
  }
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ReplayGroup_.prototype.getReplay = function(zIndex, replayType) {
  var zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
  var replays = this.replaysByZIndex_[zIndexKey];
  if (replays === undefined) {
    replays = {};
    this.replaysByZIndex_[zIndexKey] = replays;
  }
  var replay = replays[replayType];
  if (replay === undefined) {
    /**
     * @type {Function}
     */
    var Constructor = _ol_render_webgl_ReplayGroup_.BATCH_CONSTRUCTORS_[replayType];
    replay = new Constructor(this.tolerance_, this.maxExtent_);
    replays[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ReplayGroup_.prototype.isEmpty = function() {
  return _ol_obj_.isEmpty(this.replaysByZIndex_);
};


/**
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 */
_ol_render_webgl_ReplayGroup_.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash) {
  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(_ol_array_.numberSafeCompareFunction);

  var i, ii, j, jj, replays, replay;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = 0, jj = _ol_render_replay_.ORDER.length; j < jj; ++j) {
      replay = replays[_ol_render_replay_.ORDER[j]];
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
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
_ol_render_webgl_ReplayGroup_.prototype.replayHitDetection_ = function(context,
    center, resolution, rotation, size, pixelRatio, opacity,
    skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent) {
  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(function(a, b) {
    return b - a;
  });

  var i, ii, j, replays, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = _ol_render_replay_.ORDER.length - 1; j >= 0; --j) {
      replay = replays[_ol_render_replay_.ORDER[j]];
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
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
_ol_render_webgl_ReplayGroup_.prototype.forEachFeatureAtCoordinate = function(
    coordinate, context, center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    callback) {
  var gl = context.getGL();
  gl.bindFramebuffer(
      gl.FRAMEBUFFER, context.getHitDetectionFramebuffer());


  /**
   * @type {ol.Extent}
   */
  var hitExtent;
  if (this.renderBuffer_ !== undefined) {
    // build an extent around the coordinate, so that only features that
    // intersect this extent are checked
    hitExtent = _ol_extent_.buffer(
        _ol_extent_.createOrUpdateFromCoordinate(coordinate),
        resolution * this.renderBuffer_);
  }

  return this.replayHitDetection_(context,
      coordinate, resolution, rotation, _ol_render_webgl_ReplayGroup_.HIT_DETECTION_SIZE_,
      pixelRatio, opacity, skippedFeaturesHash,
      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        var imageData = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

        if (imageData[3] > 0) {
          var result = callback(feature);
          if (result) {
            return result;
          }
        }
      }, true, hitExtent);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @return {boolean} Is there a feature at the given coordinate?
 */
_ol_render_webgl_ReplayGroup_.prototype.hasFeatureAtCoordinate = function(
    coordinate, context, center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash) {
  var gl = context.getGL();
  gl.bindFramebuffer(
      gl.FRAMEBUFFER, context.getHitDetectionFramebuffer());

  var hasFeature = this.replayHitDetection_(context,
      coordinate, resolution, rotation, _ol_render_webgl_ReplayGroup_.HIT_DETECTION_SIZE_,
      pixelRatio, opacity, skippedFeaturesHash,
      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {boolean} Is there a feature?
       */
      function(feature) {
        var imageData = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        return imageData[3] > 0;
      }, false);

  return hasFeature !== undefined;
};

/**
 * @const
 * @private
 * @type {Array.<number>}
 */
_ol_render_webgl_ReplayGroup_.HIT_DETECTION_SIZE_ = [1, 1];

/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.webgl.Replay, number,
 *                ol.Extent)>}
 */
_ol_render_webgl_ReplayGroup_.BATCH_CONSTRUCTORS_ = {
  'Circle': _ol_render_webgl_CircleReplay_,
  'Image': _ol_render_webgl_ImageReplay_,
  'LineString': _ol_render_webgl_LineStringReplay_,
  'Polygon': _ol_render_webgl_PolygonReplay_,
  'Text': _ol_render_webgl_TextReplay_
};
export default _ol_render_webgl_ReplayGroup_;
