goog.provide('ol.render.webgl.ImageReplay');
goog.provide('ol.render.webgl.LineStringReplay');
goog.provide('ol.render.webgl.PolygonReplay');
goog.provide('ol.render.webgl.Replay');
goog.provide('ol.render.webgl.ReplayGroup');

goog.require('ol');
goog.require('ol.color');
goog.require('ol.ext.earcut');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.render.ReplayGroup');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.topology');
goog.require('ol.render.VectorContext');
goog.require('ol.render.replay');
goog.require('ol.render.webgl.imagereplay.defaultshader');
goog.require('ol.transform');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.linestringreplay.shader.Default');
goog.require('ol.render.webgl.linestringreplay.shader.Default.Locations');
goog.require('ol.render.webgl.linestringreplay.shader.DefaultFragment');
goog.require('ol.render.webgl.linestringreplay.shader.DefaultVertex');
goog.require('ol.render.webgl.polygonreplay.shader.Default');
goog.require('ol.render.webgl.polygonreplay.shader.Default.Locations');
//goog.require('ol.render.webgl.polygonreplay.shader.DefaultFragment');
//goog.require('ol.render.webgl.polygonreplay.shader.DefaultVertex');
goog.require('ol.vec.Mat4');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');
goog.require('ol.webgl.Context');

/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @protected
 * @struct
 */
ol.render.webgl.Replay = function(tolerance, maxExtent) {
  ol.render.VectorContext.call(this);

  /**
   * @protected
   * @type {number}
   */
  this.tolerance = tolerance;

  /**
   * @protected
   * @const
   * @type {ol.Extent}
   */
  this.maxExtent = maxExtent;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.bufferedMaxExtent_ = null;

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
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.projectionMatrix_ = ol.transform.create();

  /**
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.offsetRotateMatrix_ = ol.transform.create();

  /**
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.offsetScaleMatrix_ = ol.transform.create();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.tmpMat4_ = ol.vec.Mat4.create();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.indices_ = [];

  /**
   * @type {ol.webgl.Buffer}
   * @private
   */
  this.indicesBuffer_ = null;

  /**
   * Start index per feature (the index).
   * @type {Array.<number>}
   * @private
   */
  this.startIndices_ = [];

  /**
   * Start index per feature (the feature).
   * @type {Array.<ol.Feature|ol.render.Feature>}
   * @private
   */
  this.startIndicesFeature_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.vertices_ = [];

  /**
   * @type {ol.webgl.Buffer}
   * @private
   */
  this.verticesBuffer_ = null;

};
goog.inherits(ol.render.webgl.Replay, ol.render.VectorContext);


/**
 * @enum {number}
 */
ol.render.webgl.LineStringInstruction = {
  ROUND: 2,
  BEGIN_LINE: 3,
  END_LINE: 5,
  BEGIN_LINE_CAP: 7,
  END_LINE_CAP : 11,
  BEVEL_FIRST: 13,
  BEVEL_SECOND: 17,
  MITER_BOTTOM: 19,
  MITER_TOP: 23
};

ol.render.webgl.Replay.prototype.getDeleteResourcesFunction = goog.abstractMethod;

ol.render.webgl.Replay.prototype.finish = goog.abstractMethod;

ol.render.webgl.Replay.prototype.setUpProgram_ = goog.abstractMethod;

ol.render.webgl.Replay.prototype.drawReplay_ = goog.abstractMethod;

ol.render.webgl.Replay.prototype.drawHitDetectionReplay_ = goog.abstractMethod;

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
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.Replay.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  var gl = context.getGL();

  // bind the vertices buffer
  goog.asserts.assert(this.verticesBuffer_,
      'verticesBuffer must not be null');
  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // bind the indices buffer
  goog.asserts.assert(this.indicesBuffer_,
      'indicesBuffer must not be null');
  context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  var locations = this.setUpProgram_(gl, context, size);

  // set the "uniform" values
  var projectionMatrix = ol.transform.reset(this.projectionMatrix_);
  ol.transform.scale(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
  ol.transform.rotate(projectionMatrix, -rotation);
  ol.transform.translate(projectionMatrix, -(center[0] - this.origin_[0]), -(center[1] - this.origin_[1]));

  var offsetScaleMatrix = ol.transform.reset(this.offsetScaleMatrix_);
  ol.transform.scale(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

  var offsetRotateMatrix = ol.transform.reset(this.offsetRotateMatrix_);
  if (rotation !== 0) {
    ol.transform.rotate(offsetRotateMatrix, -rotation);
  }

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, projectionMatrix));
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, offsetScaleMatrix));
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, offsetRotateMatrix));
  gl.uniform1f(locations.u_opacity, opacity);

  // draw!
  var result;
  if (featureCallback === undefined) {
    this.drawReplay_(gl, context, skippedFeaturesHash);
  } else {
    // draw feature by feature for the hit-detection
    result = this.drawHitDetectionReplay_(gl, context, skippedFeaturesHash,
        featureCallback, oneByOne, opt_hitExtent);
  }

  // disable the vertex attrib arrays
  for (var i in locations) {
    if (i.startsWith('a_')) {
      gl.disableVertexAttribArray(locations[i]);
    }
  }


  return result;
};

/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {number} start Start index.
 * @param {number} end End index.
 */
ol.render.webgl.Replay.prototype.drawElements_ = function(
    gl, context, start, end) {
  var elementType = context.hasOESElementIndexUint ?
      ol.webgl.UNSIGNED_INT : ol.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  var numItems = end - start;
  var offsetInBytes = start * elementSize;
  gl.drawElements(ol.webgl.TRIANGLES, numItems, elementType, offsetInBytes);
};

/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @protected
 * @struct
 */
ol.render.webgl.ImageReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

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
   * @type {Array.<number>}
   * @private
   */
  this.groupIndices_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.hitDetectionGroupIndices_ = [];

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
   * @type {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
   * @private
   */
  this.hitDetectionImages_ = [];

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
   * @private
   * @type {ol.render.webgl.imagereplay.defaultshader.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.opacity_ = undefined;

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
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.hitDetectionTextures_ = [];

  /**
   * @type {number|undefined}
   * @private
   */
  this.width_ = undefined;
};
ol.inherits(ol.render.webgl.ImageReplay, ol.render.webgl.Replay);


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other ImageReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  ol.DEBUG && console.assert(this.verticesBuffer_,
      'verticesBuffer must not be null');
  ol.DEBUG && console.assert(this.indicesBuffer_,
      'indicesBuffer must not be null');
  var verticesBuffer = this.verticesBuffer_;
  var indicesBuffer = this.indicesBuffer_;
  var textures = this.textures_;
  var hitDetectionTextures = this.hitDetectionTextures_;
  var gl = context.getGL();
  return function() {
    if (!gl.isContextLost()) {
      var i, ii;
      for (i = 0, ii = textures.length; i < ii; ++i) {
        gl.deleteTexture(textures[i]);
      }
      for (i = 0, ii = hitDetectionTextures.length; i < ii; ++i) {
        gl.deleteTexture(hitDetectionTextures[i]);
      }
    }
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
  };
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} My end.
 * @private
 */
ol.render.webgl.ImageReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {
  ol.DEBUG && console.assert(this.anchorX_ !== undefined, 'anchorX is defined');
  ol.DEBUG && console.assert(this.anchorY_ !== undefined, 'anchorY is defined');
  ol.DEBUG && console.assert(this.height_ !== undefined, 'height is defined');
  ol.DEBUG && console.assert(this.imageHeight_ !== undefined,
      'imageHeight is defined');
  ol.DEBUG && console.assert(this.imageWidth_ !== undefined, 'imageWidth is defined');
  ol.DEBUG && console.assert(this.opacity_ !== undefined, 'opacity is defined');
  ol.DEBUG && console.assert(this.originX_ !== undefined, 'originX is defined');
  ol.DEBUG && console.assert(this.originY_ !== undefined, 'originY is defined');
  ol.DEBUG && console.assert(this.rotateWithView_ !== undefined,
      'rotateWithView is defined');
  ol.DEBUG && console.assert(this.rotation_ !== undefined, 'rotation is defined');
  ol.DEBUG && console.assert(this.scale_ !== undefined, 'scale is defined');
  ol.DEBUG && console.assert(this.width_ !== undefined, 'width is defined');
  var anchorX = /** @type {number} */ (this.anchorX_);
  var anchorY = /** @type {number} */ (this.anchorY_);
  var height = /** @type {number} */ (this.height_);
  var imageHeight = /** @type {number} */ (this.imageHeight_);
  var imageWidth = /** @type {number} */ (this.imageWidth_);
  var opacity = /** @type {number} */ (this.opacity_);
  var originX = /** @type {number} */ (this.originX_);
  var originY = /** @type {number} */ (this.originY_);
  var rotateWithView = this.rotateWithView_ ? 1.0 : 0.0;
  var rotation = /** @type {number} */ (this.rotation_);
  var scale = /** @type {number} */ (this.scale_);
  var width = /** @type {number} */ (this.width_);
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

    // bottom-left corner
    offsetX = -scale * anchorX;
    offsetY = -scale * (height - anchorY);
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = originX / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    // bottom-right corner
    offsetX = scale * (width - anchorX);
    offsetY = -scale * (height - anchorY);
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = (originY + height) / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    // top-right corner
    offsetX = scale * (width - anchorX);
    offsetY = scale * anchorY;
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = (originX + width) / imageWidth;
    this.vertices_[numVertices++] = originY / imageHeight;
    this.vertices_[numVertices++] = opacity;
    this.vertices_[numVertices++] = rotateWithView;

    // top-left corner
    offsetX = -scale * anchorX;
    offsetY = scale * anchorY;
    this.vertices_[numVertices++] = x;
    this.vertices_[numVertices++] = y;
    this.vertices_[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices_[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices_[numVertices++] = originX / imageWidth;
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
ol.render.webgl.ImageReplay.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
  this.startIndices_.push(this.indices_.length);
  this.startIndicesFeature_.push(feature);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawPoint = function(pointGeometry, feature) {
  this.startIndices_.push(this.indices_.length);
  this.startIndicesFeature_.push(feature);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.ImageReplay.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices_.push(this.indices_.length);
  ol.DEBUG && console.assert(this.images_.length === this.groupIndices_.length,
      'number of images and groupIndices match');
  this.hitDetectionGroupIndices_.push(this.indices_.length);
  ol.DEBUG && console.assert(this.hitDetectionImages_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionImages and hitDetectionGroupIndices match');

  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  var indices = this.indices_;
  var bits = context.hasOESElementIndexUint ? 32 : 16;
  ol.DEBUG && console.assert(indices[indices.length - 1] < Math.pow(2, bits),
      'Too large element index detected [%s] (OES_element_index_uint "%s")',
      indices[indices.length - 1], context.hasOESElementIndexUint);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(indices);
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures_(this.textures_, this.images_, texturePerImage, gl);
  ol.DEBUG && console.assert(this.textures_.length === this.groupIndices_.length,
      'number of textures and groupIndices match');

  this.createTextures_(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);
  ol.DEBUG && console.assert(this.hitDetectionTextures_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionTextures and hitDetectionGroupIndices match');

  this.anchorX_ = undefined;
  this.anchorY_ = undefined;
  this.height_ = undefined;
  this.images_ = null;
  this.hitDetectionImages_ = null;
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
 * @private
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>} images
 *    Images.
 * @param {Object.<string, WebGLTexture>} texturePerImage Texture cache.
 * @param {WebGLRenderingContext} gl Gl.
 */
ol.render.webgl.ImageReplay.prototype.createTextures_ = function(textures, images, texturePerImage, gl) {
  ol.DEBUG && console.assert(textures.length === 0,
      'upon creation, textures is empty');

  var texture, image, uid, i;
  var ii = images.length;
  for (i = 0; i < ii; ++i) {
    image = images[i];

    uid = ol.getUid(image).toString();
    if (uid in texturePerImage) {
      texture = texturePerImage[uid];
    } else {
      texture = ol.webgl.Context.createTexture(
          gl, image, ol.webgl.CLAMP_TO_EDGE, ol.webgl.CLAMP_TO_EDGE);
      texturePerImage[uid] = texture;
    }
    textures[i] = texture;
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Size} size Size.
 * @return {ol.render.webgl.imagereplay.shader.Default.Locations} Locations.
 */
ol.render.webgl.ImageReplay.prototype.setUpProgram_ = function(gl, context, size) {
  // get the program
  var fragmentShader = ol.render.webgl.imagereplay.defaultshader.fragment;
  var vertexShader = ol.render.webgl.imagereplay.defaultshader.vertex;
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations =
        new ol.render.webgl.imagereplay.defaultshader.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  // use the program (FIXME: use the return value)
  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 32, 0);

  gl.enableVertexAttribArray(locations.a_offsets);
  gl.vertexAttribPointer(locations.a_offsets, 2, ol.webgl.FLOAT,
      false, 32, 8);

  gl.enableVertexAttribArray(locations.a_texCoord);
  gl.vertexAttribPointer(locations.a_texCoord, 2, ol.webgl.FLOAT,
      false, 32, 16);

  gl.enableVertexAttribArray(locations.a_opacity);
  gl.vertexAttribPointer(locations.a_opacity, 1, ol.webgl.FLOAT,
      false, 32, 24);

  gl.enableVertexAttribArray(locations.a_rotateWithView);
  gl.vertexAttribPointer(locations.a_rotateWithView, 1, ol.webgl.FLOAT,
      false, 32, 28);

  return locations;
};

/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
ol.render.webgl.ImageReplay.prototype.drawReplay_ = function(gl, context, skippedFeaturesHash, hitDetection) {
  var textures = hitDetection ? this.hitDetectionTextures_ : this.textures_;
  var groupIndices = hitDetection ? this.hitDetectionGroupIndices_ : this.groupIndices_;
  ol.DEBUG && console.assert(textures.length === groupIndices.length,
      'number of textures and groupIndeces match');

  if (!ol.obj.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(
        gl, context, skippedFeaturesHash, textures, groupIndices);
  } else {
    var i, ii, start;
    for (i = 0, ii = textures.length, start = 0; i < ii; ++i) {
      gl.bindTexture(ol.webgl.TEXTURE_2D, textures[i]);
      var end = groupIndices[i];
      this.drawElements_(gl, context, start, end);
      start = end;
    }
  }
};


/**
 * Draw the replay while paying attention to skipped features.
 *
 * This functions creates groups of features that can be drawn to together,
 * so that the number of `drawElements` calls is minimized.
 *
 * For example given the following texture groups:
 *
 *    Group 1: A B C
 *    Group 2: D [E] F G
 *
 * If feature E should be skipped, the following `drawElements` calls will be
 * made:
 *
 *    drawElements with feature A, B and C
 *    drawElements with feature D
 *    drawElements with feature F and G
 *
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<number>} groupIndices Texture group indices.
 */
ol.render.webgl.ImageReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash, textures,
    groupIndices) {
  var featureIndex = 0;

  var i, ii;
  for (i = 0, ii = textures.length; i < ii; ++i) {
    gl.bindTexture(ol.webgl.TEXTURE_2D, textures[i]);
    var groupStart = (i > 0) ? groupIndices[i - 1] : 0;
    var groupEnd = groupIndices[i];

    var start = groupStart;
    var end = groupStart;
    while (featureIndex < this.startIndices_.length &&
        this.startIndices_[featureIndex] <= groupEnd) {
      var feature = this.startIndicesFeature_[featureIndex];

      var featureUid = ol.getUid(feature).toString();
      if (skippedFeaturesHash[featureUid] !== undefined) {
        // feature should be skipped
        if (start !== end) {
          // draw the features so far
          this.drawElements_(gl, context, start, end);
        }
        // continue with the next feature
        start = (featureIndex === this.startIndices_.length - 1) ?
            groupEnd : this.startIndices_[featureIndex + 1];
        end = start;
      } else {
        // the feature is not skipped, augment the end index
        end = (featureIndex === this.startIndices_.length - 1) ?
            groupEnd : this.startIndices_[featureIndex + 1];
      }
      featureIndex++;
    }

    if (start !== end) {
      // draw the remaining features (in case there was no skipped feature
      // in this texture group, all features of a group are drawn together)
      this.drawElements_(gl, context, start, end);
    }
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplay_ = function(gl, context, skippedFeaturesHash, featureCallback, oneByOne,
    opt_hitExtent) {
  if (!oneByOne) {
    // draw all hit-detection features in "once" (by texture group)
    return this.drawHitDetectionReplayAll_(gl, context,
        skippedFeaturesHash, featureCallback);
  } else {
    // draw hit-detection features one by one
    return this.drawHitDetectionReplayOneByOne_(gl, context,
        skippedFeaturesHash, featureCallback, opt_hitExtent);
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayAll_ = function(gl, context, skippedFeaturesHash, featureCallback) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.drawReplay_(gl, context, skippedFeaturesHash, true);

  var result = featureCallback(null);
  if (result) {
    return result;
  } else {
    return undefined;
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayOneByOne_ = function(gl, context, skippedFeaturesHash, featureCallback,
    opt_hitExtent) {
  ol.DEBUG && console.assert(this.hitDetectionTextures_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionTextures and hitDetectionGroupIndices match');

  var i, groupStart, start, end, feature, featureUid;
  var featureIndex = this.startIndices_.length - 1;
  for (i = this.hitDetectionTextures_.length - 1; i >= 0; --i) {
    gl.bindTexture(ol.webgl.TEXTURE_2D, this.hitDetectionTextures_[i]);
    groupStart = (i > 0) ? this.hitDetectionGroupIndices_[i - 1] : 0;
    end = this.hitDetectionGroupIndices_[i];

    // draw all features for this texture group
    while (featureIndex >= 0 &&
        this.startIndices_[featureIndex] >= groupStart) {
      start = this.startIndices_[featureIndex];
      feature = this.startIndicesFeature_[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || ol.extent.intersects(
              /** @type {Array<number>} */ (opt_hitExtent),
              feature.getGeometry().getExtent()))) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements_(gl, context, start, end);

        var result = featureCallback(feature);
        if (result) {
          return result;
        }
      }

      end = start;
      featureIndex--;
    }
  }
  return undefined;
};


/**
 * @inheritDoc
 * @abstract
 */
ol.render.webgl.ImageReplay.prototype.setFillStrokeStyle = function() {};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  var anchor = imageStyle.getAnchor();
  var image = imageStyle.getImage(1);
  var imageSize = imageStyle.getImageSize();
  var hitDetectionImage = imageStyle.getHitDetectionImage(1);
  var hitDetectionImageSize = imageStyle.getHitDetectionImageSize();
  var opacity = imageStyle.getOpacity();
  var origin = imageStyle.getOrigin();
  var rotateWithView = imageStyle.getRotateWithView();
  var rotation = imageStyle.getRotation();
  var size = imageStyle.getSize();
  var scale = imageStyle.getScale();
  ol.DEBUG && console.assert(anchor, 'imageStyle anchor is not null');
  ol.DEBUG && console.assert(image, 'imageStyle image is not null');
  ol.DEBUG && console.assert(imageSize,
      'imageStyle imageSize is not null');
  ol.DEBUG && console.assert(hitDetectionImage,
      'imageStyle hitDetectionImage is not null');
  ol.DEBUG && console.assert(hitDetectionImageSize,
      'imageStyle hitDetectionImageSize is not null');
  ol.DEBUG && console.assert(opacity !== undefined, 'imageStyle opacity is defined');
  ol.DEBUG && console.assert(origin, 'imageStyle origin is not null');
  ol.DEBUG && console.assert(rotateWithView !== undefined,
      'imageStyle rotateWithView is defined');
  ol.DEBUG && console.assert(rotation !== undefined, 'imageStyle rotation is defined');
  ol.DEBUG && console.assert(size, 'imageStyle size is not null');
  ol.DEBUG && console.assert(scale !== undefined, 'imageStyle scale is defined');

  var currentImage;
  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    currentImage = this.images_[this.images_.length - 1];
    if (ol.getUid(currentImage) != ol.getUid(image)) {
      this.groupIndices_.push(this.indices_.length);
      ol.DEBUG && console.assert(this.groupIndices_.length === this.images_.length,
          'number of groupIndices and images match');
      this.images_.push(image);
    }
  }

  if (this.hitDetectionImages_.length === 0) {
    this.hitDetectionImages_.push(hitDetectionImage);
  } else {
    currentImage =
        this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
    if (ol.getUid(currentImage) != ol.getUid(hitDetectionImage)) {
      this.hitDetectionGroupIndices_.push(this.indices_.length);
      ol.DEBUG && console.assert(this.hitDetectionGroupIndices_.length ===
          this.hitDetectionImages_.length,
          'number of hitDetectionGroupIndices and hitDetectionImages match');
      this.hitDetectionImages_.push(hitDetectionImage);
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
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @protected
 * @struct
 */
ol.render.webgl.LineStringReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

/**
   * @private
   * @type {ol.render.webgl.linestringreplay.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {{strokeColor: (Array.<number>|null),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined)}|null}
   */
  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined
  };

  this.startIndices_ = [0];

};
ol.inherits(ol.render.webgl.LineStringReplay, ol.render.webgl.Replay);


/**
 * Draw one segment.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 */
ol.render.webgl.LineStringReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {

  var i, ii;
  var numVertices = this.vertices_.length;
  var numIndices = this.indices_.length;
  //To save a vertex, the direction of a point is a product of the sign (1 or -1), a prime from
  //ol.render.webgl.LineStringInstruction, and a rounding factor (1 or 2). If the product is even,
  //we round it. If it is odd, we don't.
  var lineJoin = this.state_.lineJoin === 'bevel' ? 0 :
      this.state_.lineJoin === 'miter' ? 1 : 2;
  var lineCap = this.state_.lineCap === 'butt' ? 0 :
      this.state_.lineCap === 'square' ? 1 : 2;
  var closed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, offset, end, stride);
  var startCoords, sign, n;
  var lastIndex = numIndices;
  var lastSign = 1;
  //We need the adjacent vertices to define normals in joins. p0 = last, p1 = current, p2 = next.
  //We rotate those points, thus every point is RTE corrected only once.
  var p0, p1, p2;

  for (i = offset, ii = end; i < ii; i += stride) {

    n = numVertices / 7;

    p0 = p1;
    p1 = p2 || [flatCoordinates[i] - this.origin_[0], flatCoordinates[i + 1] - this.origin_[1]];
    //First vertex.
    if (i === offset) {
      p2 = [flatCoordinates[i + stride] - this.origin_[0], flatCoordinates[i + stride + 1] - this.origin_[1]];
      if (end - offset === stride * 2 && ol.array.equals(p1, p2)) {
        break;
      }
      if (closed) {
        //A closed line! Complete the circle.
        p0 = [flatCoordinates[end - stride * 2] - this.origin_[0],
            flatCoordinates[end - stride * 2 + 1] - this.origin_[1]];

        startCoords = p2;
      } else {
        //Add the first two/four vertices.

        if (lineCap) {
          numVertices = this.addVertices_([0, 0], p1, p2,
              lastSign * ol.render.webgl.LineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_([0, 0], p1, p2,
              -lastSign * ol.render.webgl.LineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          this.indices_[numIndices++] = n + 2;
          this.indices_[numIndices++] = n;
          this.indices_[numIndices++] = n + 1;

          this.indices_[numIndices++] = n + 1;
          this.indices_[numIndices++] = n + 3;
          this.indices_[numIndices++] = n + 2;

        }

        numVertices = this.addVertices_([0, 0], p1, p2,
            lastSign * ol.render.webgl.LineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_([0, 0], p1, p2,
            -lastSign * ol.render.webgl.LineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        lastIndex = n + 3;

        continue;
      }
    } else if (i === end - stride) {
      //Last vertex.
      if (closed) {
        //Same as the first vertex.
        p2 = startCoords;
        break;
      } else {
        //For the compiler not to complain. This will never be [0, 0].
        p0 = p0 || [0, 0];

        numVertices = this.addVertices_(p0, p1, [0, 0],
            lastSign * ol.render.webgl.LineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_(p0, p1, [0, 0],
            -lastSign * ol.render.webgl.LineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        this.indices_[numIndices++] = n;
        this.indices_[numIndices++] = lastIndex - 1;
        this.indices_[numIndices++] = lastIndex;

        this.indices_[numIndices++] = lastIndex;
        this.indices_[numIndices++] = n + 1;
        this.indices_[numIndices++] = n;

        if (lineCap) {
          numVertices = this.addVertices_(p0, p1, [0, 0],
              lastSign * ol.render.webgl.LineStringInstruction.END_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_(p0, p1, [0, 0],
              -lastSign * ol.render.webgl.LineStringInstruction.END_LINE_CAP * lineCap, numVertices);

          this.indices_[numIndices++] = n + 2;
          this.indices_[numIndices++] = n;
          this.indices_[numIndices++] = n + 1;

          this.indices_[numIndices++] = n + 1;
          this.indices_[numIndices++] = n + 3;
          this.indices_[numIndices++] = n + 2;

        }

        break;
      }
    } else {
      p2 = [flatCoordinates[i + stride] - this.origin_[0], flatCoordinates[i + stride + 1] - this.origin_[1]];
    }

    sign = ol.geom.flat.orient.linearRingIsClockwise([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]], 0, 6, 2)
        ? 1 : -1;

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.LineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.LineStringInstruction.BEVEL_SECOND * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.LineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

    if (i > offset) {
      this.indices_[numIndices++] = n;
      this.indices_[numIndices++] = lastIndex - 1;
      this.indices_[numIndices++] = lastIndex;

      this.indices_[numIndices++] = n + 2;
      this.indices_[numIndices++] = n;
      this.indices_[numIndices++] = lastSign * sign > 0 ? lastIndex : lastIndex - 1;
    }

    this.indices_[numIndices++] = n;
    this.indices_[numIndices++] = n + 2;
    this.indices_[numIndices++] = n + 1;

    lastIndex = n + 2;
    lastSign = sign;

    //Add miter
    if (lineJoin) {
      numVertices = this.addVertices_(p0, p1, p2,
          sign * ol.render.webgl.LineStringInstruction.MITER_TOP * lineJoin, numVertices);

      this.indices_[numIndices++] = n + 1;
      this.indices_[numIndices++] = n + 3;
      this.indices_[numIndices++] = n;
    }
  }

  if (closed) {
    //Link the last triangle/rhombus to the first one.
    //n will never be numVertices / 7 here. However, the compiler complains otherwise.
    n = n || numVertices / 7;
    sign = ol.geom.flat.orient.linearRingIsClockwise([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]], 0, 6, 2)
        ? 1 : -1;

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.LineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.LineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

    this.indices_[numIndices++] = n;
    this.indices_[numIndices++] = lastIndex - 1;
    this.indices_[numIndices++] = lastIndex;

    this.indices_[numIndices++] = n + 1;
    this.indices_[numIndices++] = n;
    this.indices_[numIndices++] = lastSign * sign > 0 ? lastIndex : lastIndex - 1;
  }
};

/**
 * @param {Array.<number>} p0 Last coordinates.
 * @param {Array.<number>} p1 Current coordinates.
 * @param {Array.<number>} p2 Next coordinates.
 * @param {number} product Sign, instruction, and rounding product.
 * @param {number} numVertices Vertex counter.
 * @return {number} Vertex counter.
 * @private
 */
ol.render.webgl.LineStringReplay.prototype.addVertices_ = function(p0, p1, p2, product, numVertices) {
  this.vertices_[numVertices++] = p0[0];
  this.vertices_[numVertices++] = p0[1];
  this.vertices_[numVertices++] = p1[0];
  this.vertices_[numVertices++] = p1[1];
  this.vertices_[numVertices++] = p2[0];
  this.vertices_[numVertices++] = p2[1];
  this.vertices_[numVertices++] = product;

  return numVertices;
};

/**
 * Check if the linestring can be drawn (i. e. valid).
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} The linestring can be drawn.
 * @private
 */
ol.render.webgl.LineStringReplay.prototype.isValid_ = function(flatCoordinates, offset, end, stride) {
  var range = end - offset;
  if (range < stride * 2) {
    return false;
  } else if (range === stride * 2) {
    var firstP = [flatCoordinates[offset], flatCoordinates[offset + 1]];
    var lastP = [flatCoordinates[offset + stride], flatCoordinates[offset + stride + 1]];
    return !ol.array.equals(firstP, lastP);
  }

  return true;
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  if (this.isValid_(flatCoordinates, 0, flatCoordinates.length, stride)) {
    this.drawCoordinates_(
        flatCoordinates, 0, flatCoordinates.length, stride);
    this.startIndices_.push(this.indices_.length);
    this.startIndicesFeature_.push(feature);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  var indexCount = this.indices_.length;
  var lineStringGeometries = multiLineStringGeometry.getLineStrings();
  var i, ii;
  for (i = 0, ii = lineStringGeometries.length; i < ii; ++i) {
    var flatCoordinates = lineStringGeometries[i].getFlatCoordinates();
    var stride = lineStringGeometries[i].getStride();
    if (this.isValid_(flatCoordinates, 0, flatCoordinates.length, stride)) {
      this.drawCoordinates_(
          flatCoordinates, 0, flatCoordinates.length, stride);
    }
  }
  if (this.indices_.length > indexCount) {
    this.startIndices_.push(this.indices_.length);
    this.startIndicesFeature_.push(feature);
  }
};


/**
 * @param {ol.webgl.Context} context Context.
 **/
ol.render.webgl.LineStringReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(this.indices_);
  context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  this.vertices_ = null;
  this.indices_ = null;
};


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.LineStringReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other LineStringReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  goog.asserts.assert(!goog.isNull(this.verticesBuffer_),
      'verticesBuffer must not be null');
  var verticesBuffer = this.verticesBuffer_;
  var indicesBuffer = this.indicesBuffer_;
  return function() {
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
  };
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Size} size Size.
 * @return {ol.render.webgl.linestringreplay.shader.Default.Locations} Locations.
 */
ol.render.webgl.LineStringReplay.prototype.setUpProgram_ = function(gl, context, size) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader =
      ol.render.webgl.linestringreplay.shader.DefaultFragment.getInstance();
  vertexShader =
      ol.render.webgl.linestringreplay.shader.DefaultVertex.getInstance();
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (goog.isNull(this.defaultLocations_)) {
    locations = new ol.render.webgl.linestringreplay.shader.Default
      .Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_lastPos);
  gl.vertexAttribPointer(locations.a_lastPos, 2, goog.webgl.FLOAT,
      false, 28, 0);

  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, goog.webgl.FLOAT,
      false, 28, 8);

  gl.enableVertexAttribArray(locations.a_nextPos);
  gl.vertexAttribPointer(locations.a_nextPos, 2, goog.webgl.FLOAT,
      false, 28, 16);

  gl.enableVertexAttribArray(locations.a_direction);
  gl.vertexAttribPointer(locations.a_direction, 1, goog.webgl.FLOAT,
      false, 28, 24);

  // Enable renderer specific uniforms. If clauses needed, as otherwise the compiler complains.
  gl.uniform4fv(locations.u_color, this.state_.strokeColor);
  if (this.state_.lineWidth) {
    gl.uniform1f(locations.u_lineWidth, this.state_.lineWidth);
  }
  if (this.state_.miterLimit) {
    gl.uniform1f(locations.u_miterLimit, this.state_.miterLimit);
  }
  gl.uniform2fv(locations.u_size, size);

  return locations;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
ol.render.webgl.LineStringReplay.prototype.drawReplay_ = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Save GL parameters.
  var tmpDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
  var tmpDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  gl.depthFunc(gl.NOTEQUAL);
  if (!goog.object.isEmpty(skippedFeaturesHash)) {
    // TODO: draw by blocks to skip features
  } else {
    var end = this.startIndices_[this.startIndices_.length - 1];
    this.drawElements_(gl, context, 0, end);
  }
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  //Restore GL parameters.
  gl.depthMask(tmpDepthMask);
  gl.depthFunc(tmpDepthFunc);
};

/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.LineStringReplay.prototype.drawHitDetectionReplay_ = function(gl, context, skippedFeaturesHash, featureCallback, oneByOne,
    opt_hitExtent) {
  //if (!oneByOne) {
    // draw all hit-detection features in "once" (by texture group)
    //return this.drawHitDetectionReplayAll_(gl, context,
    //    skippedFeaturesHash, featureCallback);
  //} else {
    // draw hit-detection features one by one
    //return this.drawHitDetectionReplayOneByOne_(gl, context,
    //    skippedFeaturesHash, featureCallback, opt_hitExtent);
  //}
  return 0;
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
  goog.asserts.assert(!fillStyle, 'fillStyle should be null');
  goog.asserts.assert(strokeStyle, 'strokeStyle should not be null');
  var strokeStyleColor = strokeStyle.getColor();
  this.state_.strokeColor = ol.color.asArray(strokeStyleColor).map(function(c, i) {
    return i != 3 ? c / 255 : c;
  }) || ol.render.webgl.defaultStrokeStyle;
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.webgl.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.webgl.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : ol.render.webgl.defaultLineJoin;
  var strokeStyleWidth = strokeStyle.getWidth();
  this.state_.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.webgl.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  this.state_.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : ol.render.webgl.defaultMiterLimit;
};


/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @protected
 * @struct
 */
ol.render.webgl.PolygonReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

  /**
   * @private
   * @type {ol.Color|undefined}
   */
  this.fillColor_ = undefined;

  /**
   * @private
   * @type {ol.Color|undefined}
   */
  this.strokeColor_ = undefined;

  /**
   * @private
   */
  this.lineStringReplay_ = new ol.render.webgl.LineStringReplay(
      tolerance, maxExtent);

  /**
   * The origin of the coordinate system for the point coordinates sent to
   * the GPU.
   * @private
   * @type {ol.Coordinate}
   */
  this.origin_ = ol.extent.getCenter(maxExtent);

  /**
   * @type {Array.<number>}
   * @private
   */
  this.indices_ = [];

  /**
   * @type {ol.webgl.Buffer}
   * @private
   */
  this.indicesBuffer_ = null;

  /**
   * @private
   * @type {ol.render.webgl.polygonreplay.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @type {!goog.vec.Mat4.Number}
   * @private
   */
  this.projectionMatrix_ = goog.vec.Mat4.createNumberIdentity();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.vertices_ = [];

  /**
   * @type {ol.webgl.Buffer}
   * @private
   */
  this.verticesBuffer_ = null;

  /**
   * Start index per feature (the index).
   * @type {Array.<number>}
   * @private
   */
  this.startIndices_ = [];

  /**
   * Start index per feature (the feature).
   * @type {Array.<ol.Feature>|Array.<ol.render.Feature>}
   * @private
   */
  this.startIndicesFeature_ = [];
};
ol.inherits(ol.render.webgl.PolygonReplay, ol.render.webgl.Replay);


/**
 * Draw one polygon.
 * @param {Array.<Array.<ol.Coordinate>>} coordinates Coordinates.
 * @private
 */
ol.render.webgl.PolygonReplay.prototype.drawCoordinates_ = function(coordinates) {
  // Triangulate the polgon
  var triangulation = ol.ext.earcut(coordinates, true);
  var i, ii;
  var indices = triangulation.indices;

  // Shift the indices to take into account previously handled polygons
  var offset = this.vertices_.length / 6;
  for (i = 0, ii = indices.length; i < ii; ++i) {
    this.indices_.push(indices[i] + offset);
  }

  // Add the color property to each vertex
  // TODO performance: make it more efficient
  var vertices = triangulation.vertices;
  for (i = 0, ii = vertices.length / 2; i < ii; ++i) {
    this.vertices_.push(vertices[2 * i]);
    this.vertices_.push(vertices[2 * i + 1]);
    this.vertices_.push(this.fillColor_[0]);
    this.vertices_.push(this.fillColor_[1]);
    this.vertices_.push(this.fillColor_[2]);
    this.vertices_.push(this.fillColor_[3]);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawMultiPolygon = function(geometry, feature) {
  if (goog.isNull(this.fillColor_)) {
    return;
  }
  var coordinatess = geometry.getCoordinates();
  this.startIndices_.push(this.indices_.length);
  this.startIndicesFeature_.push(feature);
  var i, ii;
  for (i = 0, ii = coordinatess.length; i < ii; i++) {
    this.drawCoordinates_(coordinatess[i]);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawPolygon = function(polygonGeometry, feature) {
  if (goog.isNull(this.fillColor_)) {
    return;
  }
  var coordinates = polygonGeometry.getCoordinates();
  this.startIndices_.push(this.indices_.length);
  this.startIndicesFeature_.push(feature);
  this.drawCoordinates_(coordinates);

  if (!goog.isNull(this.lineStringReplay_.state_.strokeColor)) {
    var linearRings = polygonGeometry.getLinearRings();
    var i, ii;
    for (i = 0, ii = linearRings.length; i < ii; i++) {
      //FIXME: Substitute zeros with appropriate values when implementing.
      this.lineStringReplay_.drawCoordinates_(linearRings[i].getFlatCoordinates(), 0, 0, 0);
    }
  }
};


/**
 * @param {ol.webgl.Context} context Context.
 **/
ol.render.webgl.PolygonReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  var indices = this.indices_;
  var bits = context.hasOESElementIndexUint ? 32 : 16;
  goog.asserts.assert(indices[indices.length - 1] < Math.pow(2, bits),
      'Too large element index detected [%s] (OES_element_index_uint "%s")',
      indices[indices.length - 1], context.hasOESElementIndexUint);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(indices);
  context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);
  this.lineStringReplay_.finish(context);
};


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.PolygonReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other PolygonReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  goog.asserts.assert(!goog.isNull(this.verticesBuffer_),
      'verticesBuffer must not be null');
  goog.asserts.assert(!goog.isNull(this.indicesBuffer_),
      'indicesBuffer must not be null');
  var verticesBuffer = this.verticesBuffer_;
  var indicesBuffer = this.indicesBuffer_;
  var lineDeleter = this.lineStringReplay_.getDeleteResourcesFunction(context);
  return function() {
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
    lineDeleter();
  };
};


/**
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {number} brightness Global brightness.
 * @param {number} contrast Global contrast.
 * @param {number} hue Global hue.
 * @param {number} saturation Global saturation.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
/*ol.render.webgl.PolygonReplay.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, brightness, contrast, hue, saturation, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  var gl = context.getGL();

  // bind the vertices buffer
  goog.asserts.assert(!goog.isNull(this.verticesBuffer_),
      'verticesBuffer must not be null');
  context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // bind the indices buffer
  goog.asserts.assert(!goog.isNull(this.indicesBuffer_),
      'indicesBuffer must not be null');
  context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  // get the program
  var fragmentShader, vertexShader;
  fragmentShader =
      ol.render.webgl.polygonreplay.shader.DefaultFragment.getInstance();
  vertexShader =
      ol.render.webgl.polygonreplay.shader.DefaultVertex.getInstance();
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (goog.isNull(this.defaultLocations_)) {
    locations = new ol.render.webgl.polygonreplay.shader.Default
      .Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, goog.webgl.FLOAT,
      false, 24, 0);

  gl.enableVertexAttribArray(locations.a_color);
  gl.vertexAttribPointer(locations.a_color, 4, goog.webgl.FLOAT,
      false, 24, 8);

  // set the "uniform" values
  // TODO: use RTE to avoid jitter
  var projectionMatrix = this.projectionMatrix_;
  ol.vec.Mat4.makeTransform2D(projectionMatrix,
      0.0, 0.0,
      pixelRatio * 2 / (resolution * size[0]),
      pixelRatio * 2 / (resolution * size[1]),
      -rotation,
      -center[0], -center[1]);

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false, projectionMatrix);

  // draw!
  var result;
  if (!goog.isDef(featureCallback)) {
    this.drawReplay_(gl, context, skippedFeaturesHash);
  } else {
    // TODO: draw feature by feature for the hit-detection
  }

  // disable the vertex attrib arrays
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_color);

  this.lineStringReplay_.replay(context,
      center, resolution, rotation, size, pixelRatio,
      opacity, skippedFeaturesHash,
      featureCallback, oneByOne, opt_hitExtent);
  // FIXME get result
  return result;
};*/


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.PolygonReplay.prototype.drawReplay_ = function(gl, context, skippedFeaturesHash) {
  var elementType = context.hasOESElementIndexUint ?
      goog.webgl.UNSIGNED_INT : goog.webgl.UNSIGNED_SHORT;
  //  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  if (!goog.object.isEmpty(skippedFeaturesHash)) {
    // TODO: draw by blocks to skip features
  } else {
    var numItems = this.indices_.length;
    gl.drawElements(goog.webgl.TRIANGLES, numItems, elementType, 0);
  }
};


/**
 * @inheritDoc
 */

ol.render.webgl.PolygonReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  // TODO implement
  if (fillStyle) {
    var fillStyleColor = fillStyle.getColor();
    this.fillColor_ = !goog.isNull(fillStyleColor) && Array.isArray(fillStyleColor) ?
        ol.color.asArray(fillStyleColor).map(function(c, i) {
          return i != 3 ? c / 255.0 : c;
        }) : ol.render.webgl.defaultFillStyle;
  } else {
    this.fillColor_ = undefined;
  }
  if (strokeStyle) {
    var strokeStyleColor = strokeStyle.getColor();
    this.strokeColor_ = !goog.isNull(strokeStyleColor) ?
        ol.color.asArray(strokeStyleColor).map(function(c, i) {
          return i != 3 ? c / 255 : c;
        }) : ol.render.webgl.defaultStrokeStyle;
  } else {
    this.strokeColor_ = undefined;
  }
  this.lineStringReplay_.setFillStrokeStyle(fillStyle, strokeStyle);
};


/**
 * @constructor
 * @extends {ol.render.ReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @param {number=} opt_renderBuffer Render buffer.
 * @struct
 */
ol.render.webgl.ReplayGroup = function(tolerance, maxExtent, opt_renderBuffer) {
  ol.render.ReplayGroup.call(this);

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
   * ImageReplay only is supported at this point.
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.Replay>}
   * @private
   */
  this.replays_ = {};

};
ol.inherits(ol.render.webgl.ReplayGroup, ol.render.ReplayGroup);


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.ReplayGroup.prototype.getDeleteResourcesFunction = function(context) {
  var functions = [];
  var replayKey;
  for (replayKey in this.replays_) {
    functions.push(
        this.replays_[replayKey].getDeleteResourcesFunction(context));
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
ol.render.webgl.ReplayGroup.prototype.finish = function(context) {
  var replayKey;
  for (replayKey in this.replays_) {
    this.replays_[replayKey].finish(context);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.ReplayGroup.prototype.getReplay = function(zIndex, replayType) {
  var replay = this.replays_[replayType];
  if (replay === undefined) {
    var constructor = ol.render.webgl.BATCH_CONSTRUCTORS_[replayType];
    replay = new constructor(this.tolerance_, this.maxExtent_);
    this.replays_[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.webgl.ReplayGroup.prototype.isEmpty = function() {
  return ol.obj.isEmpty(this.replays_);
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
ol.render.webgl.ReplayGroup.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash) {
  var i, ii, replay;
  for (i = 0, ii = ol.render.replay.ORDER.length; i < ii; ++i) {
    replay = this.replays_[ol.render.replay.ORDER[i]];
    if (replay !== undefined) {
      replay.replay(context,
          center, resolution, rotation, size, pixelRatio,
          opacity, skippedFeaturesHash,
          undefined, false);
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
ol.render.webgl.ReplayGroup.prototype.replayHitDetection_ = function(context,
    center, resolution, rotation, size, pixelRatio, opacity,
    skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent) {
  var i, replay, result;
  for (i = ol.render.replay.ORDER.length - 1; i >= 0; --i) {
    replay = this.replays_[ol.render.replay.ORDER[i]];
    if (replay !== undefined) {
      result = replay.replay(context,
          center, resolution, rotation, size, pixelRatio, opacity,
          skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent);
      if (result) {
        return result;
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
ol.render.webgl.ReplayGroup.prototype.forEachFeatureAtCoordinate = function(
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
    hitExtent = ol.extent.buffer(
        ol.extent.createOrUpdateFromCoordinate(coordinate),
        resolution * this.renderBuffer_);
  }

  return this.replayHitDetection_(context,
      coordinate, resolution, rotation, ol.render.webgl.HIT_DETECTION_SIZE_,
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
ol.render.webgl.ReplayGroup.prototype.hasFeatureAtCoordinate = function(
    coordinate, context, center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash) {
  var gl = context.getGL();
  gl.bindFramebuffer(
      gl.FRAMEBUFFER, context.getHitDetectionFramebuffer());

  var hasFeature = this.replayHitDetection_(context,
      coordinate, resolution, rotation, ol.render.webgl.HIT_DETECTION_SIZE_,
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
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.webgl.Replay, number,
 *                ol.Extent)>}
 */
ol.render.webgl.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.webgl.ImageReplay,
  'LineString': ol.render.webgl.LineStringReplay//,
  //'Polygon': ol.render.webgl.PolygonReplay
};


/**
 * @const
 * @private
 * @type {Array.<number>}
 */
ol.render.webgl.HIT_DETECTION_SIZE_ = [1, 1];
