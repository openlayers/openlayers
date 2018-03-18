goog.provide('ol.render.canvas.ReplayGroup');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.geom.flat.transform');
goog.require('ol.obj');
goog.require('ol.render.ReplayGroup');
goog.require('ol.render.ReplayType');
goog.require('ol.render.canvas.Replay');
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
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay group can have overlapping geometries.
 * @param {?} declutterTree Declutter tree
 * for declutter processing in postrender.
 * @param {number=} opt_renderBuffer Optional rendering buffer.
 * @struct
 */
ol.render.canvas.ReplayGroup = function(
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree, opt_renderBuffer) {
  ol.render.ReplayGroup.call(this);

  /**
   * Declutter tree.
   * @private
   */
  this.declutterTree_ = declutterTree;

  /**
   * @type {ol.DeclutterGroup}
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
 * This cache is used for storing calculated pixel circles for increasing performance.
 * It is a static property to allow each Replaygroup to access it.
 * @type {Object.<number, Array.<Array.<(boolean|undefined)>>>}
 * @private
 */
ol.render.canvas.ReplayGroup.circleArrayCache_ = {
  0: [[true]]
};


/**
 * This method fills a row in the array from the given coordinate to the
 * middle with `true`.
 * @param {Array.<Array.<(boolean|undefined)>>} array The array that will be altered.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @private
 */
ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_ = function(array, x, y) {
  var i;
  var radius = Math.floor(array.length / 2);
  if (x >= radius) {
    for (i = radius; i < x; i++) {
      array[i][y] = true;
    }
  } else if (x < radius) {
    for (i = x + 1; i < radius; i++) {
      array[i][y] = true;
    }
  }
};


/**
 * This methods creates a circle inside a fitting array. Points inside the
 * circle are marked by true, points on the outside are undefined.
 * It uses the midpoint circle algorithm.
 * A cache is used to increase performance.
 * @param {number} radius Radius.
 * @returns {Array.<Array.<(boolean|undefined)>>} An array with marked circle points.
 * @private
 */
ol.render.canvas.ReplayGroup.getCircleArray_ = function(radius) {
  if (ol.render.canvas.ReplayGroup.circleArrayCache_[radius] !== undefined) {
    return ol.render.canvas.ReplayGroup.circleArrayCache_[radius];
  }

  var arraySize = radius * 2 + 1;
  var arr = new Array(arraySize);
  for (var i = 0; i < arraySize; i++) {
    arr[i] = new Array(arraySize);
  }

  var x = radius;
  var y = 0;
  var error = 0;

  while (x >= y) {
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius + x, radius + y);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius + y, radius + x);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius - y, radius + x);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius - x, radius + y);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius - x, radius - y);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius - y, radius - x);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius + y, radius - x);
    ol.render.canvas.ReplayGroup.fillCircleArrayRowToMiddle_(arr, radius + x, radius - y);

    y++;
    error += 1 + 2 * y;
    if (2 * (error - x) + 1 > 0) {
      x -= 1;
      error += 1 - 2 * x;
    }
  }

  ol.render.canvas.ReplayGroup.circleArrayCache_[radius] = arr;
  return arr;
};


/**
 * @param {!Object.<string, Array.<*>>} declutterReplays Declutter replays.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 */
ol.render.canvas.ReplayGroup.replayDeclutter = function(declutterReplays, context, rotation) {
  var zs = Object.keys(declutterReplays).map(Number).sort(ol.array.numberSafeCompareFunction);
  var skippedFeatureUids = {};
  for (var z = 0, zz = zs.length; z < zz; ++z) {
    var replayData = declutterReplays[zs[z].toString()];
    for (var i = 0, ii = replayData.length; i < ii;) {
      var replay = replayData[i++];
      var transform = replayData[i++];
      replay.replay(context, transform, rotation, skippedFeatureUids);
    }
  }
};


/**
 * @param {boolean} group Group with previous replay.
 * @return {ol.DeclutterGroup} Declutter instruction group.
 */
ol.render.canvas.ReplayGroup.prototype.addDeclutter = function(group) {
  var declutter = null;
  if (this.declutterTree_) {
    if (group) {
      declutter = this.declutterGroup_;
      /** @type {number} */ (declutter[4])++;
    } else {
      declutter = this.declutterGroup_ = ol.extent.createEmpty();
      declutter.push(1);
    }
  }
  return declutter;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 */
ol.render.canvas.ReplayGroup.prototype.clip = function(context, transform) {
  var flatClipCoords = this.getClipCoords(transform);
  context.beginPath();
  context.moveTo(flatClipCoords[0], flatClipCoords[1]);
  context.lineTo(flatClipCoords[2], flatClipCoords[3]);
  context.lineTo(flatClipCoords[4], flatClipCoords[5]);
  context.lineTo(flatClipCoords[6], flatClipCoords[7]);
  context.clip();
};


/**
 * @param {Array.<ol.render.ReplayType>} replays Replays.
 * @return {boolean} Has replays of the provided types.
 */
ol.render.canvas.ReplayGroup.prototype.hasReplays = function(replays) {
  for (var zIndex in this.replaysByZIndex_) {
    var candidates = this.replaysByZIndex_[zIndex];
    for (var i = 0, ii = replays.length; i < ii; ++i) {
      if (replays[i] in candidates) {
        return true;
      }
    }
  }
  return false;
};


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
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T} callback Feature
 *     callback.
 * @param {Object.<string, ol.DeclutterGroup>} declutterReplays Declutter
 *     replays.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.forEachFeatureAtCoordinate = function(
    coordinate, resolution, rotation, hitTolerance, skippedFeaturesHash, callback, declutterReplays) {

  hitTolerance = Math.round(hitTolerance);
  var contextSize = hitTolerance * 2 + 1;
  var transform = ol.transform.compose(this.hitDetectionTransform_,
      hitTolerance + 0.5, hitTolerance + 0.5,
      1 / resolution, -1 / resolution,
      -rotation,
      -coordinate[0], -coordinate[1]);
  var context = this.hitDetectionContext_;

  if (context.canvas.width !== contextSize || context.canvas.height !== contextSize) {
    context.canvas.width = contextSize;
    context.canvas.height = contextSize;
  } else {
    context.clearRect(0, 0, contextSize, contextSize);
  }

  /**
   * @type {ol.Extent}
   */
  var hitExtent;
  if (this.renderBuffer_ !== undefined) {
    hitExtent = ol.extent.createEmpty();
    ol.extent.extendCoordinate(hitExtent, coordinate);
    ol.extent.buffer(hitExtent, resolution * (this.renderBuffer_ + hitTolerance), hitExtent);
  }

  var mask = ol.render.canvas.ReplayGroup.getCircleArray_(hitTolerance);
  var declutteredFeatures;
  if (this.declutterTree_) {
    declutteredFeatures = this.declutterTree_.all().map(function(entry) {
      return entry.value;
    });
  }

  var replayType;

  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @return {?} Callback result.
   */
  function featureCallback(feature) {
    var imageData = context.getImageData(0, 0, contextSize, contextSize).data;
    for (var i = 0; i < contextSize; i++) {
      for (var j = 0; j < contextSize; j++) {
        if (mask[i][j]) {
          if (imageData[(j * contextSize + i) * 4 + 3] > 0) {
            var result;
            if (!(declutteredFeatures && (replayType == ol.render.ReplayType.IMAGE || replayType == ol.render.ReplayType.TEXT)) ||
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

  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);

  var i, j, replays, replay, result;
  for (i = zs.length - 1; i >= 0; --i) {
    var zIndexKey = zs[i].toString();
    replays = this.replaysByZIndex_[zIndexKey];
    for (j = ol.render.replay.ORDER.length - 1; j >= 0; --j) {
      replayType = ol.render.replay.ORDER[j];
      replay = replays[replayType];
      if (replay !== undefined) {
        if (declutterReplays &&
            (replayType == ol.render.ReplayType.IMAGE || replayType == ol.render.ReplayType.TEXT)) {
          var declutter = declutterReplays[zIndexKey];
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
};


/**
 * @param {ol.Transform} transform Transform.
 * @return {Array.<number>} Clip coordinates.
 */
ol.render.canvas.ReplayGroup.prototype.getClipCoords = function(transform) {
  var maxExtent = this.maxExtent_;
  var minX = maxExtent[0];
  var minY = maxExtent[1];
  var maxX = maxExtent[2];
  var maxY = maxExtent[3];
  var flatClipCoords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY];
  ol.geom.flat.transform.transform2D(
      flatClipCoords, 0, 8, 2, transform, flatClipCoords);
  return flatClipCoords;
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
    replay = new Constructor(this.tolerance_, this.maxExtent_,
        this.resolution_, this.pixelRatio_, this.overlaps_, this.declutterTree_);
    replays[replayType] = replay;
  }
  return replay;
};


/**
 * @return {Object.<string, Object.<ol.render.ReplayType, ol.render.canvas.Replay>>} Replays.
 */
ol.render.canvas.ReplayGroup.prototype.getReplays = function() {
  return this.replaysByZIndex_;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.isEmpty = function() {
  return ol.obj.isEmpty(this.replaysByZIndex_);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<ol.render.ReplayType>=} opt_replayTypes Ordered replay types
 *     to replay. Default is {@link ol.render.replay.ORDER}
 * @param {Object.<string, ol.DeclutterGroup>=} opt_declutterReplays Declutter
 *     replays.
 */
ol.render.canvas.ReplayGroup.prototype.replay = function(context,
    transform, viewRotation, skippedFeaturesHash, opt_replayTypes, opt_declutterReplays) {

  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);

  // setup clipping so that the parts of over-simplified geometries are not
  // visible outside the current extent when panning
  context.save();
  this.clip(context, transform);

  var replayTypes = opt_replayTypes ? opt_replayTypes : ol.render.replay.ORDER;
  var i, ii, j, jj, replays, replay;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    var zIndexKey = zs[i].toString();
    replays = this.replaysByZIndex_[zIndexKey];
    for (j = 0, jj = replayTypes.length; j < jj; ++j) {
      var replayType = replayTypes[j];
      replay = replays[replayType];
      if (replay !== undefined) {
        if (opt_declutterReplays &&
            (replayType == ol.render.ReplayType.IMAGE || replayType == ol.render.ReplayType.TEXT)) {
          var declutter = opt_declutterReplays[zIndexKey];
          if (!declutter) {
            opt_declutterReplays[zIndexKey] = [replay, transform.slice(0)];
          } else {
            declutter.push(replay, transform.slice(0));
          }
        } else {
          replay.replay(context, transform, viewRotation, skippedFeaturesHash);
        }
      }
    }
  }

  context.restore();
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.canvas.Replay, number, ol.Extent,
 *                number, number, boolean, Array.<ol.DeclutterGroup>)>}
 */
ol.render.canvas.ReplayGroup.BATCH_CONSTRUCTORS_ = {
  'Circle': ol.render.canvas.PolygonReplay,
  'Default': ol.render.canvas.Replay,
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay,
  'Text': ol.render.canvas.TextReplay
};
