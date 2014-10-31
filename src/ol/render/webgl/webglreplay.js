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
ol.render.webgl.ImageReplay = function(tolerance) {

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = ol.extent.createEmpty();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.groupIndices_ = [];

  /**
   * @type {number|undefined}
   * @private
   */
  this.height_ = undefined;

  /**
   * @type {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
   * @private
   */
  this.images_ = [];

  /**
   * @type {number|undefined}
   * @private
   */
  this.imageHeight_ = undefined;

  /**
   * @type {number|undefined}
   * @private
   */
  this.imageWidth_ = undefined;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.indices_ = [];

  /**
   * @type {WebGLBuffer}
   * @private
   */
  this.indicesBuffer_ = null;

  /**
   * @type {number|undefined}
   * @private
   */
  this.originX_ = undefined;

  /**
   * @type {number|undefined}
   * @private
   */
  this.originY_ = undefined;

  /**
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.textures_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.vertices_ = [];

  /**
   * @type {WebGLBuffer}
   * @private
   */
  this.verticesBuffer_ = null;

  /**
   * @type {number|undefined}
   * @private
   */
  this.width_ = undefined;

};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawAsync = goog.abstractMethod;


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
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.imageHeight_));
  goog.asserts.assert(goog.isDef(this.imageWidth_));
  goog.asserts.assert(goog.isDef(this.originX_));
  goog.asserts.assert(goog.isDef(this.originY_));
  goog.asserts.assert(goog.isDef(this.width_));
  var height = this.height_;
  var imageHeight = this.imageHeight_;
  var imageWidth = this.imageWidth_;
  var originX = this.originX_;
  var originY = this.originY_;
  var width = this.width_;
  var numIndices = this.indices_.length;
  var numVertices = this.vertices_.length;
  var i, x, y, n;
  for (i = offset; i < end; i += stride) {
    x = flatCoordinates[i];
    y = flatCoordinates[i + 1];

    n = numVertices / 6;

    // create 4 vertices per coordinate

    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = -width;
    this.vertices_[numVertices++] = -height;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;

    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = width;
    this.vertices_[numVertices++] = -height;
    this.vertices_[numVertices++] = originX / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;

    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = width;
    this.vertices_[numVertices++] = height;
    this.vertices_[numVertices++] = originX / imageWidth;
    this.vertices_[numVertices++] = originY / imageHeight;

    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = -width;
    this.vertices_[numVertices++] = height;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = originY / imageHeight;

    this.indices_[numIndices++] = n;
    this.indices_[numIndices++] = n + 1;
    this.indices_[numIndices++] = n + 2;
    this.indices_[numIndices++] = n;
    this.indices_[numIndices++] = n + 2;
    this.indices_[numIndices++] = n + 3;
  }

  return numVertices;
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawCircleGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawFeature = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawGeometryCollectionGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


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
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod;


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
ol.render.webgl.ImageReplay.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawText = goog.abstractMethod;


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ImageReplay.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices_.push(this.indices_.length);
  goog.asserts.assert(this.images_.length == this.groupIndices_.length);

  this.verticesBuffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);
  gl.bufferData(goog.webgl.ARRAY_BUFFER,
      new Float32Array(this.vertices_), goog.webgl.STATIC_DRAW);
  this.indicesBuffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);
  gl.bufferData(goog.webgl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices_), goog.webgl.STATIC_DRAW);

  goog.asserts.assert(this.textures_.length === 0);

  var i;
  var ii = this.images_.length;
  var texture;
  for (i = 0; i < ii; ++i) {
    var image = this.images_[i];
    texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texParameteri(goog.webgl.TEXTURE_2D,
        goog.webgl.TEXTURE_WRAP_S, goog.webgl.CLAMP_TO_EDGE);
    gl.texParameteri(goog.webgl.TEXTURE_2D,
        goog.webgl.TEXTURE_WRAP_T, goog.webgl.CLAMP_TO_EDGE);
    gl.texParameteri(goog.webgl.TEXTURE_2D,
        goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.NEAREST);
    gl.texParameteri(goog.webgl.TEXTURE_2D,
        goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.NEAREST);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, image);
    this.textures_[i] = texture;
  }

  goog.asserts.assert(this.textures_.length == this.groupIndices_.length);

  this.height_ = undefined;
  this.images_ = null;
  this.imageHeight_ = undefined;
  this.imageWidth_ = undefined;
  this.indices_ = null;
  this.originX_ = undefined;
  this.originY_ = undefined;
  this.vertices_ = null;
  this.width_ = undefined;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.render.webgl.ImageReplay.prototype.getExtent = function() {
  return this.extent_;
};


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
ol.render.webgl.ImageReplay.prototype.replay = function(context,
    positionAttribLocation, offsetsAttribLocation, texCoordAttribLocation,
    projectionMatrixLocation, sizeMatrixLocation,
    pixelRatio, size, transform, skippedFeaturesHash) {
  var gl = context.getGL();

  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.vertexAttribPointer(positionAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 0);

  gl.enableVertexAttribArray(offsetsAttribLocation);
  gl.vertexAttribPointer(offsetsAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 8);

  gl.enableVertexAttribArray(texCoordAttribLocation);
  gl.vertexAttribPointer(texCoordAttribLocation, 2, goog.webgl.FLOAT,
      false, 24, 16);


  gl.uniformMatrix4fv(projectionMatrixLocation, false, transform);
  gl.uniformMatrix2fv(sizeMatrixLocation, false,
      new Float32Array([1 / size[0], 0.0, 0.0, 1 / size[1]]));

  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  goog.asserts.assert(this.textures_.length == this.groupIndices_.length);

  var i;
  var ii = this.textures_.length;
  for (i = 0; i < ii; ++i) {
    gl.bindTexture(goog.webgl.TEXTURE_2D, this.textures_[i]);
    gl.drawElements(goog.webgl.TRIANGLES, this.groupIndices_[i],
        goog.webgl.UNSIGNED_SHORT, 0);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setFillStrokeStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  var image = imageStyle.getImage(1);
  goog.asserts.assert(!goog.isNull(image));
  // FIXME getImageSize does not exist for circles
  var imageSize = imageStyle.getImageSize();
  goog.asserts.assert(!goog.isNull(imageSize));
  var origin = imageStyle.getOrigin();
  goog.asserts.assert(!goog.isNull(origin));
  var size = imageStyle.getSize();
  goog.asserts.assert(!goog.isNull(size));

  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    var currentImage = this.images_[this.images_.length - 1];
    if (goog.getUid(currentImage) != goog.getUid(image)) {
      this.groupIndices_.push(this.indices_.length);
      goog.asserts.assert(this.groupIndices_.length == this.images_.length);
      this.images_.push(image);
    }
  }

  this.height_ = size[1];
  this.imageHeight_ = imageSize[1];
  this.imageWidth_ = imageSize[0];
  this.originX_ = origin[0];
  this.originY_ = origin[1];
  this.width_ = size[0];
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setTextStyle = goog.abstractMethod;



/**
 * @constructor
 * @implements {ol.render.IReplayGroup}
 * @param {number} tolerance Tolerance.
 * @struct
 */
ol.render.webgl.ReplayGroup = function(tolerance) {

  /**
   * @type {number}
   * @private
   */
  this.tolerance_ = tolerance;

  /**
   * ImageReplay only is supported at this point.
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.ImageReplay>}
   * @private
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
 *                function(new: ol.render.webgl.ImageReplay, number)>}
 */
ol.render.webgl.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.webgl.ImageReplay
};
