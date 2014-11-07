goog.provide('ol.render.webgl.ReplayGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.extent');
goog.require('ol.render.IReplayGroup');
goog.require('ol.render.webgl.imagereplay.shader');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @implements {ol.render.IVectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @protected
 * @struct
 */
ol.render.webgl.ImageReplay = function(tolerance, maxExtent) {

  /**
   * @type {number|undefined}
   * @private
   */
  this.anchorX_ = undefined;

  /**
   * @type {number|undefined}
   * @private
   */
  this.anchorY_ = undefined;

  /**
   * The origin of the coordinate system for the point coordinates sent to
   * the GPU. To eliminate jitter caused by precision problems in the GPU
   * we use the "Rendering Relative to Eye" technique described in the "3D
   * Engine Design for Virtual Globes" book.
   * @private
   * @type {ol.Coordinate}
   */
  this.origin_ = ol.extent.getCenter(maxExtent);

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ =
      ol.render.webgl.imagereplay.shader.Fragment.getInstance();

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
   * @private
   * @type {ol.render.webgl.imagereplay.shader.Locations}
   */
  this.locations_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.opacity_ = undefined;

  /**
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.offsetRotateMatrix_ = goog.vec.Mat4.createNumberIdentity();

  /**
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.offsetScaleMatrix_ = goog.vec.Mat4.createNumberIdentity();

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
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.projectionMatrix_ = goog.vec.Mat4.createNumberIdentity();

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.rotateWithView_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.rotation_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.scale_ = undefined;

  /**
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.textures_ = [];

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ =
      ol.render.webgl.imagereplay.shader.Vertex.getInstance();

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
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ImageReplay.prototype.deleteTextures =
    function(frameState, context) {
  frameState.postRenderFunctions.push(
      goog.partial(
          /**
           * @param {WebGLRenderingContext} gl GL.
           * @param {Array.<WebGLTexture>} textures Textures.
           */
          function(gl, textures) {
            if (!gl.isContextLost()) {
              var i, ii;
              for (i = 0, ii = textures.length; i < ii; ++i) {
                gl.deleteTexture(textures[i]);
              }
            }
          }, context.getGL(), this.textures_));

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
  goog.asserts.assert(goog.isDef(this.anchorX_));
  goog.asserts.assert(goog.isDef(this.anchorY_));
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.imageHeight_));
  goog.asserts.assert(goog.isDef(this.imageWidth_));
  goog.asserts.assert(goog.isDef(this.opacity_));
  goog.asserts.assert(goog.isDef(this.originX_));
  goog.asserts.assert(goog.isDef(this.originY_));
  goog.asserts.assert(goog.isDef(this.rotateWithView_));
  goog.asserts.assert(goog.isDef(this.rotation_));
  goog.asserts.assert(goog.isDef(this.scale_));
  goog.asserts.assert(goog.isDef(this.width_));
  var anchorX = this.anchorX_;
  var anchorY = this.anchorY_;
  var height = this.height_;
  var imageHeight = this.imageHeight_;
  var imageWidth = this.imageWidth_;
  var opacity = this.opacity_;
  var originX = this.originX_;
  var originY = this.originY_;
  var rotateWithView = this.rotateWithView_ ? 1.0 : 0.0;
  var rotation = this.rotation_;
  var scale = this.scale_;
  var width = this.width_;
  var cos = Math.cos(rotation);
  var sin = Math.sin(rotation);
  var numIndices = this.indices_.length;
  var numVertices = this.vertices_.length;
  var i, n, offsetX, offsetY, x, y;
  for (i = offset; i < end; i += stride) {
    x = flatCoordinates[i] - this.origin_[0];
    y = flatCoordinates[i + 1] - this.origin_[1];

    // There are 4 vertices per [x, y] point, one for each corner of the
    // rectangle we're going to draw. We'd use 1 vertex per [x, y] point if
    // WebGL supported Geometry Shaders (which can emit new vertices), but that
    // is not currently the case.
    //
    // And each vertex includes 8 values: the x and y coordinates, the x and
    // y offsets used to calculate the position of the corner, the u and
    // v texture coordinates for the corner, the opacity, and whether the
    // the image should be rotated with the view (rotateWithView).

    n = numVertices / 8;

    offsetX = -scale * anchorX;
    offsetY = -scale * (height - anchorY);
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    offsetX = scale * (width - anchorX);
    offsetY = -scale * (height - anchorY);
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = originX / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    offsetX = scale * (width - anchorX);
    offsetY = scale * anchorY;
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = originX / imageWidth;
    this.vertices_[numVertices++] = originY / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    offsetX = -scale * anchorX;
    offsetY = scale * anchorY;
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = originY / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

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
        goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D,
        goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, image);
    this.textures_[i] = texture;
  }

  goog.asserts.assert(this.textures_.length == this.groupIndices_.length);

  this.anchorX_ = undefined;
  this.anchorY_ = undefined;
  this.height_ = undefined;
  this.images_ = null;
  this.imageHeight_ = undefined;
  this.imageWidth_ = undefined;
  this.indices_ = null;
  this.opacity_ = undefined;
  this.originX_ = undefined;
  this.originY_ = undefined;
  this.rotateWithView_ = undefined;
  this.rotation_ = undefined;
  this.scale_ = undefined;
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
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.replay = function(context,
    center, resolution, rotation, size, extent, pixelRatio,
    skippedFeaturesHash) {
  var gl = context.getGL();

  var program = context.getProgram(
      this.fragmentShader_, this.vertexShader_);
  context.useProgram(program);

  if (goog.isNull(this.locations_)) {
    this.locations_ =
        new ol.render.webgl.imagereplay.shader.Locations(
            gl, program);
  }

  var projectionMatrix = this.projectionMatrix_;
  ol.vec.Mat4.makeTransform2D(projectionMatrix,
      0.0, 0.0,
      2 / (resolution * size[0]),
      2 / (resolution * size[1]),
      -rotation,
      -(center[0] - this.origin_[0]), -(center[1] - this.origin_[1]));

  var offsetScaleMatrix = this.offsetScaleMatrix_;
  goog.vec.Mat4.makeScale(offsetScaleMatrix, 2 / size[0], 2 / size[1], 1);

  var offsetRotateMatrix = this.offsetRotateMatrix_;
  goog.vec.Mat4.makeIdentity(offsetRotateMatrix);
  if (rotation !== 0) {
    goog.vec.Mat4.rotateZ(offsetRotateMatrix, -rotation);
  }

  var locations = this.locations_;

  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, goog.webgl.FLOAT,
      false, 32, 0);

  gl.enableVertexAttribArray(locations.a_offsets);
  gl.vertexAttribPointer(locations.a_offsets, 2, goog.webgl.FLOAT,
      false, 32, 8);

  gl.enableVertexAttribArray(locations.a_texCoord);
  gl.vertexAttribPointer(locations.a_texCoord, 2, goog.webgl.FLOAT,
      false, 32, 16);

  gl.enableVertexAttribArray(locations.a_opacity);
  gl.vertexAttribPointer(locations.a_opacity, 1, goog.webgl.FLOAT,
      false, 32, 24);

  gl.enableVertexAttribArray(locations.a_rotateWithView);
  gl.vertexAttribPointer(locations.a_rotateWithView, 1, goog.webgl.FLOAT,
      false, 32, 28);

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false, offsetScaleMatrix);
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
      offsetRotateMatrix);

  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  goog.asserts.assert(this.textures_.length == this.groupIndices_.length);

  var i, ii, start;
  for (i = 0, ii = this.textures_.length, start = 0; i < ii; ++i) {
    gl.bindTexture(goog.webgl.TEXTURE_2D, this.textures_[i]);
    var end = this.groupIndices_[i];
    gl.drawElements(goog.webgl.TRIANGLES, end - start,
        goog.webgl.UNSIGNED_SHORT, start);
    start = end;
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
  var anchor = imageStyle.getAnchor();
  goog.asserts.assert(!goog.isNull(anchor));
  var image = imageStyle.getImage(1);
  goog.asserts.assert(!goog.isNull(image));
  var imageSize = imageStyle.getImageSize();
  goog.asserts.assert(!goog.isNull(imageSize));
  var opacity = imageStyle.getOpacity();
  goog.asserts.assert(goog.isDef(opacity));
  var origin = imageStyle.getOrigin();
  goog.asserts.assert(!goog.isNull(origin));
  var rotateWithView = imageStyle.getRotateWithView();
  goog.asserts.assert(goog.isDef(rotateWithView));
  var rotation = imageStyle.getRotation();
  goog.asserts.assert(goog.isDef(rotation));
  var size = imageStyle.getSize();
  goog.asserts.assert(!goog.isNull(size));
  var scale = imageStyle.getScale();
  goog.asserts.assert(goog.isDef(scale));

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

  this.anchorX_ = anchor[0];
  this.anchorY_ = anchor[1];
  this.height_ = size[1];
  this.imageHeight_ = imageSize[1];
  this.imageWidth_ = imageSize[0];
  this.opacity_ = opacity;
  this.originX_ = origin[0];
  this.originY_ = origin[1];
  this.rotation_ = rotation;
  this.rotateWithView_ = rotateWithView;
  this.scale_ = scale;
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
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.ReplayGroup = function(tolerance, maxExtent) {

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
   * ImageReplay only is supported at this point.
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.ImageReplay>}
   * @private
   */
  this.replays_ = {};

};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ReplayGroup.prototype.deleteTextures =
    function(frameState, context) {
  var replayKey;
  for (replayKey in this.replays_) {
    this.replays_[replayKey].deleteTextures(frameState, context);
  }
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
    replay = new constructor(this.tolerance_, this.maxExtent_);
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
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ReplayGroup.prototype.replay = function(context,
    center, resolution, rotation, size, extent, pixelRatio,
    skippedFeaturesHash) {
  var i, ii, replay, result;
  for (i = 0, ii = ol.render.REPLAY_ORDER.length; i < ii; ++i) {
    replay = this.replays_[ol.render.REPLAY_ORDER[i]];
    if (goog.isDef(replay) &&
        ol.extent.intersects(extent, replay.getExtent())) {
      result = replay.replay(context,
          center, resolution, rotation, size, extent, pixelRatio,
          skippedFeaturesHash);
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
 *                function(new: ol.render.webgl.ImageReplay, number,
 *                ol.Extent)>}
 */
ol.render.webgl.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.webgl.ImageReplay
};
