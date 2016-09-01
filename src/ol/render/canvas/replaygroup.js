goog.provide('ol.render.canvas.ReplayGroup');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.geom.flat.transform');
goog.require('ol.obj');
goog.require('ol.render.ReplayGroup');
goog.require('ol.render.canvas.ImageReplay');
goog.require('ol.render.canvas.LineStringReplay');
goog.require('ol.render.canvas.PolygonReplay');
goog.require('ol.render.canvas.TextReplay');
goog.require('ol.render.replay');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.render.ReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @param {number} resolution Resolution.
 * @param {boolean} overlaps The replay group can have overlapping geometries.
 * @param {number=} opt_renderBuffer Optional rendering buffer.
 * @struct
 */
ol.render.canvas.ReplayGroup = function(
    tolerance, maxExtent, resolution, overlaps, opt_renderBuffer) {
  ol.render.ReplayGroup.call(this);

  /**
   * @private
   * @type {number}
   */
  this.tolerance_ = tolerance;

  /**
   * @private
   * @type {ol.Extent}
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
  this.resolution_ = resolution;

  /**
   * @private
   * @type {number|undefined}
   */
  this.renderBuffer_ = opt_renderBuffer;

  /**
   * @private
   * @type {!Object.<string,
   *        Object.<ol.render.ReplayType, ol.render.canvas.Replay>>}
   */
  this.replaysByZIndex_ = {};

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitDetectionContext_ = ol.dom.createCanvasContext2D(1, 1);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.hitDetectionTransform_ = ol.transform.create();

};
ol.inherits(ol.render.canvas.ReplayGroup, ol.render.ReplayGroup);


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.ReplayGroup.prototype.finish = function() {
  var zKey;
  for (zKey in this.replaysByZIndex_) {
    var replays = this.replaysByZIndex_[zKey];
    var replayKey;
    for (replayKey in replays) {
      replays[replayKey].finish();
    }
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T} callback Feature
 *     callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.forEachFeatureAtCoordinate = function(
    coordinate, resolution, rotation, skippedFeaturesHash, callback) {

  var transform = ol.transform.compose(this.hitDetectionTransform_,
      0.5, 0.5,
      1 / resolution, -1 / resolution,
      -rotation,
      -coordinate[0], -coordinate[1]);

  var context = this.hitDetectionContext_;
  context.clearRect(0, 0, 1, 1);

  /**
   * @type {ol.Extent}
   */
  var hitExtent;
  if (this.renderBuffer_ !== undefined) {
    hitExtent = ol.extent.createEmpty();
    ol.extent.extendCoordinate(hitExtent, coordinate);
    ol.extent.buffer(hitExtent, resolution * this.renderBuffer_, hitExtent);
  }

  return this.replayHitDetection_(context, transform, rotation,
      skippedFeaturesHash,
      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        var imageData = context.getImageData(0, 0, 1, 1).data;
        if (imageData[3] > 0) {
          var result = callback(feature);
          if (result) {
            return result;
          }
          context.clearRect(0, 0, 1, 1);
        }
      }, hitExtent);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.getReplay = function(zIndex, replayType) {
  var zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
  var replays = this.replaysByZIndex_[zIndexKey];
  if (replays === undefined) {
    replays = {};
    this.replaysByZIndex_[zIndexKey] = replays;
  }
  var replay = replays[replayType];
  if (replay === undefined) {
    var Constructor = ol.render.canvas.ReplayGroup.BATCH_CONSTRUCTORS_[replayType];
    ol.DEBUG && console.assert(Constructor !== undefined,
        replayType +
        ' constructor missing from ol.render.canvas.ReplayGroup.BATCH_CONSTRUCTORS_');
    replay = new Constructor(this.tolerance_, this.maxExtent_,
        this.resolution_, this.overlaps_);
    replays[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.isEmpty = function() {
  return ol.obj.isEmpty(this.replaysByZIndex_);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<ol.render.ReplayType>=} opt_replayTypes Ordered replay types
 *     to replay. Default is {@link ol.render.replay.ORDER}
 */
ol.render.canvas.ReplayGroup.prototype.replay = function(context, pixelRatio,
    transform, viewRotation, skippedFeaturesHash, opt_replayTypes) {

  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);

  // setup clipping so that the parts of over-simplified geometries are not
  // visible outside the current extent when panning
  var maxExtent = this.maxExtent_;
  var minX = maxExtent[0];
  var minY = maxExtent[1];
  var maxX = maxExtent[2];
  var maxY = maxExtent[3];
  var flatClipCoords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY];
  ol.geom.flat.transform.transform2D(
      flatClipCoords, 0, 8, 2, transform, flatClipCoords);
  context.save();
  context.beginPath();
  context.moveTo(flatClipCoords[0], flatClipCoords[1]);
  context.lineTo(flatClipCoords[2], flatClipCoords[3]);
  context.lineTo(flatClipCoords[4], flatClipCoords[5]);
  context.lineTo(flatClipCoords[6], flatClipCoords[7]);
  context.clip();

  var replayTypes = opt_replayTypes ? opt_replayTypes : ol.render.replay.ORDER;
  var i, ii, j, jj, replays, replay;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = 0, jj = replayTypes.length; j < jj; ++j) {
      replay = replays[replayTypes[j]];
      if (replay !== undefined) {
        replay.replay(context, pixelRatio, transform, viewRotation,
            skippedFeaturesHash);
      }
    }
  }

  context.restore();
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T} featureCallback
 *     Feature callback.
 * @param {ol.Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.replayHitDetection_ = function(
    context, transform, viewRotation, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(function(a, b) {
    return b - a;
  });

  var i, ii, j, replays, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = ol.render.replay.ORDER.length - 1; j >= 0; --j) {
      replay = replays[ol.render.replay.ORDER[j]];
      if (replay !== undefined) {
        result = replay.replayHitDetection(context, transform, viewRotation,
            skippedFeaturesHash, featureCallback, opt_hitExtent);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.canvas.Replay, number, ol.Extent,
 *                number, boolean)>}
 */
ol.render.canvas.ReplayGroup.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay,
  'Text': ol.render.canvas.TextReplay
};
