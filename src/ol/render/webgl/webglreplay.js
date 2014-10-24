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
  this.vertices = [];

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.indices = [];

  /**
   * @protected
   * @type {WebGLBuffer}
   */
  this.verticesBuffer = null;

  /**
   * @protected
   * @type {WebGLBuffer}
   */
  this.indicesBuffer = null;

  /**
   * @protected
   * @type {WebGLTexture}
   */
  this.texture = null;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = ol.extent.createEmpty();

};


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.Replay.prototype.finish = goog.nullFunction;


/**
 * @param {ol.webgl.Context} context Context.
 * @param {number} positionAttribLocation Attribute location for positions.
 * @param {number} offsetsAttribLocation Attribute location for offsets.
 * @param {number} texCoordAttribLocation Attribute location for texCoord.
 * @param {WebGLUniformLocation} projectionMatrixLocation Proj matrix location.
 * @param {WebGLUniformLocation} sizeMatrixLocation Size matrix location.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<number>} size Size.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.Replay.prototype.replay = function(context,
    positionAttribLocation, offsetsAttribLocation, texCoordAttribLocation,
    projectionMatrixLocation, sizeMatrixLocation,
    pixelRatio, size, transform, skippedFeaturesHash) {
  var gl = context.getGL();

  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.vertexAttribPointer(positionAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 0);

  gl.enableVertexAttribArray(offsetsAttribLocation);
  gl.vertexAttribPointer(offsetsAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 8);

  gl.enableVertexAttribArray(texCoordAttribLocation);
  gl.vertexAttribPointer(texCoordAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 16);

  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture);

  gl.uniformMatrix4fv(projectionMatrixLocation, false, transform);
  gl.uniformMatrix2fv(sizeMatrixLocation, false,
      new Float32Array([1 / size[0], 0.0, 0.0, 1 / size[1]]));

  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
  gl.drawElements(goog.webgl.TRIANGLES, this.indices.length,
      goog.webgl.UNSIGNED_SHORT, 0);
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

  /**
   * @private
   * @type {number|undefined}
   */
  this.height_ = undefined;

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = undefined;

};
goog.inherits(ol.render.webgl.ImageReplay, ol.render.webgl.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} My end.
 * @private
 */
ol.render.webgl.ImageReplay.prototype.drawCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  goog.asserts.assert(goog.isDef(this.width_));
  goog.asserts.assert(goog.isDef(this.height_));
  var numIndices = this.indices.length;
  var numVertices = this.vertices.length;
  var i, x, y, n;
  var ox = this.width_;
  var oy = this.height_;
  for (i = offset; i < end; i += stride) {
    x = flatCoordinates[i];
    y = flatCoordinates[i + 1];

    n = numVertices / 6;

    // create 4 vertices per coordinate

    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = -ox;
    this.vertices[numVertices++] = -oy;
    this.vertices[numVertices++] = 1;
    this.vertices[numVertices++] = 1;

    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = ox;
    this.vertices[numVertices++] = -oy;
    this.vertices[numVertices++] = 0;
    this.vertices[numVertices++] = 1;

    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = ox;
    this.vertices[numVertices++] = oy;
    this.vertices[numVertices++] = 0;
    this.vertices[numVertices++] = 0;

    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = -ox;
    this.vertices[numVertices++] = oy;
    this.vertices[numVertices++] = 1;
    this.vertices[numVertices++] = 0;

    this.indices[numIndices++] = n;
    this.indices[numIndices++] = n + 1;
    this.indices[numIndices++] = n + 2;
    this.indices[numIndices++] = n;
    this.indices[numIndices++] = n + 2;
    this.indices[numIndices++] = n + 3;
  }

  return numVertices;
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
  this.verticesBuffer = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer);
  gl.bufferData(goog.webgl.ARRAY_BUFFER,
      new Float32Array(this.vertices), goog.webgl.STATIC_DRAW);
  this.indicesBuffer = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
  gl.bufferData(goog.webgl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices), goog.webgl.STATIC_DRAW);

  this.texture = gl.createTexture();
  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture);
  gl.texParameteri(goog.webgl.TEXTURE_2D,
      goog.webgl.TEXTURE_WRAP_S, goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(goog.webgl.TEXTURE_2D,
      goog.webgl.TEXTURE_WRAP_T, goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(goog.webgl.TEXTURE_2D,
      goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.NEAREST);
  gl.texParameteri(goog.webgl.TEXTURE_2D,
      goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.NEAREST);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA,
      goog.webgl.UNSIGNED_BYTE, this.image_);

  this.image_ = null;
  this.width_ = undefined;
  this.height_ = undefined;
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
  if (goog.isNull(this.image_)) {
    var image = imageStyle.getImage(1);
    goog.asserts.assert(!goog.isNull(image));
    var size = imageStyle.getSize();
    goog.asserts.assert(!goog.isNull(size));
    this.image_ = image;
    this.width_ = size[0];
    this.height_ = size[1];
  }
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
 * @param {number} positionAttribLocation Attribute location for positions.
 * @param {number} offsetsAttribLocation Attribute location for offsets.
 * @param {number} texCoordAttribLocation Attribute location for texCoord.
 * @param {WebGLUniformLocation} projectionMatrixLocation Proj matrix location.
 * @param {WebGLUniformLocation} sizeMatrixLocation Size matrix location.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<number>} size Size.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ReplayGroup.prototype.replay = function(context,
    positionAttribLocation, offsetsAttribLocation, texCoordAttribLocation,
    projectionMatrixLocation, sizeMatrixLocation,
    extent, pixelRatio, size, transform, skippedFeaturesHash) {
  var i, ii, replay, result;
  for (i = 0, ii = ol.render.REPLAY_ORDER.length; i < ii; ++i) {
    replay = this.replays_[ol.render.REPLAY_ORDER[i]];
    if (goog.isDef(replay) &&
        ol.extent.intersects(extent, replay.getExtent())) {
      result = replay.replay(context,
          positionAttribLocation, offsetsAttribLocation, texCoordAttribLocation,
          projectionMatrixLocation, sizeMatrixLocation,
          pixelRatio, size, transform, skippedFeaturesHash);
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
