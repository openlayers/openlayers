goog.provide('ol.render.webgl.ReplayGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.render.IReplayGroup');



/**
 * @constructor
 * @implements {ol.render.IVectorContext}
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.webgl.Replay = function(tolerance) {

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.coordinates = [];

  /**
   * @protected
   * @type {WebGLBuffer}
   */
  this.buffer = null;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = ol.extent.createEmpty();

};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 * @protected
 * @return {number} My end.
 */
ol.render.webgl.Replay.prototype.appendFlatCoordinates =
    function(flatCoordinates, offset, end, stride, close) {
  var myEnd = this.coordinates.length;
  var i;
  for (i = offset; i < end; i += stride) {
    this.coordinates[myEnd++] = flatCoordinates[i];
    this.coordinates[myEnd++] = flatCoordinates[i + 1];
  }
  if (close) {
    this.coordinates[myEnd++] = flatCoordinates[offset];
    this.coordinates[myEnd++] = flatCoordinates[offset + 1];
  }
  return myEnd;
};


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.Replay.prototype.finish = goog.nullFunction;


/**
 * @param {ol.webgl.Context} context Context.
 * @param {number} attribLocation Attribute location.
 * @param {WebGLUniformLocation} projectionMatrixLocation Projection
 *     matrix location.
 * @param {number} pixelRatio Pixel ratio.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.Replay.prototype.replay =
    function(context, attribLocation, projectionMatrixLocation,
        pixelRatio, transform, skippedFeaturesHash) {
  var gl = context.getGL();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer);
  gl.uniformMatrix4fv(projectionMatrixLocation, false,
      transform);
  gl.enableVertexAttribArray(attribLocation);
  gl.vertexAttribPointer(attribLocation, 2, goog.webgl.FLOAT,
      false, 0, 0);
  gl.drawArrays(goog.webgl.POINTS, 0, this.coordinates.length / 2);
};


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawAsync = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawCircleGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawFeature = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawGeometryCollectionGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawLineStringGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawMultiPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.drawText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.setFillStrokeStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.setImageStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.Replay.prototype.setTextStyle = goog.abstractMethod;



/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.webgl.ImageReplay = function(tolerance) {

  goog.base(this, tolerance);

};
goog.inherits(ol.render.webgl.ImageReplay, ol.render.webgl.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} My end.
 */
ol.render.webgl.ImageReplay.prototype.drawCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  return this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawPointGeometry =
    function(pointGeometry, data) {
  ol.extent.extend(this.extent_, pointGeometry.getExtent());
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
  ol.extent.extend(this.extent_, multiPointGeometry.getExtent());
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ImageReplay.prototype.finish = function(context) {
  var gl = context.getGL();
  this.buffer = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer);
  gl.bufferData(goog.webgl.ARRAY_BUFFER,
      new Float32Array(this.coordinates), goog.webgl.STATIC_DRAW);
};


/**
 * @return {ol.Extent} Extent.
 */
ol.render.webgl.Replay.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setImageStyle = function(imageStyle) {
};



/**
 * @constructor
 * @implements {ol.render.IReplayGroup}
 * @param {number} tolerance Tolerance.
 * @struct
 */
ol.render.webgl.ReplayGroup = function(tolerance) {

  /**
   * @private
   * @type {number}
   */
  this.tolerance_ = tolerance;

  /**
   * @private
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.Replay>}
   */
  this.replays_ = {};

};


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ReplayGroup.prototype.finish = function(context) {
  var replayKey;
  for (replayKey in this.replays_) {
    this.replays_[replayKey].finish(context);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.ReplayGroup.prototype.getReplay =
    function(zIndex, replayType) {
  var replay = this.replays_[replayType];
  if (!goog.isDef(replay)) {
    var constructor = ol.render.webgl.BATCH_CONSTRUCTORS_[replayType];
    goog.asserts.assert(goog.isDef(constructor));
    replay = new constructor(this.tolerance_);
    this.replays_[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.webgl.ReplayGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.replays_);
};


/**
 * @param {ol.webgl.Context} context Context.
 * @param {number} attribLocation Attribute location.
 * @param {WebGLUniformLocation} projectionMatrixLocation Projection
 *        matrix location.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ReplayGroup.prototype.replay = function(
    context, attribLocation, projectionMatrixLocation, extent,
    pixelRatio, transform, skippedFeaturesHash) {
  var i, ii, replay, result;
  for (i = 0, ii = ol.render.REPLAY_ORDER.length; i < ii; ++i) {
    replay = this.replays_[ol.render.REPLAY_ORDER[i]];
    if (goog.isDef(replay) &&
        ol.extent.intersects(extent, replay.getExtent())) {
      result = replay.replay(
          context, attribLocation, projectionMatrixLocation,
          pixelRatio, transform, skippedFeaturesHash);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.webgl.Replay, number)>}
 */
ol.render.webgl.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.webgl.ImageReplay
};
