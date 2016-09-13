goog.provide('ol.render.webgl.ImageReplay');
goog.provide('ol.render.webgl.LineStringReplay');
goog.provide('ol.render.webgl.PolygonReplay');
goog.provide('ol.render.webgl.Replay');
goog.provide('ol.render.webgl.ReplayGroup');

goog.require('ol');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.render.ReplayGroup');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.transform');
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
goog.require('ol.render.webgl.polygonreplay.shader.DefaultFragment');
goog.require('ol.render.webgl.polygonreplay.shader.DefaultVertex');
goog.require('ol.style.Stroke');
goog.require('ol.structs.LinkedList');
goog.require('ol.structs.RBush');
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
   * @type {ol.Transform}
   * @private
   */
  this.projectionMatrix_ = ol.transform.create();

  /**
   * @type {ol.Transform}
   * @private
   */
  this.offsetRotateMatrix_ = ol.transform.create();

  /**
   * @type {ol.Transform}
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

  /**
   * Optional parameter for PolygonReplay instances.
   * @type {ol.render.webgl.LineStringReplay|undefined}
   * @private
   */
  this.lineStringReplay_ = undefined;

};
ol.inherits(ol.render.webgl.Replay, ol.render.VectorContext);


ol.render.webgl.Replay.prototype.getDeleteResourcesFunction = goog.abstractMethod;

ol.render.webgl.Replay.prototype.finish = goog.abstractMethod;

ol.render.webgl.Replay.prototype.setUpProgram_ = goog.abstractMethod;

ol.render.webgl.Replay.prototype.drawReplay_ = goog.abstractMethod;


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
ol.render.webgl.Replay.prototype.drawHitDetectionReplay_ = function(gl, context, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
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
ol.render.webgl.Replay.prototype.drawHitDetectionReplayAll_ = function(gl, context, skippedFeaturesHash,
    featureCallback) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.drawReplay_(gl, context, skippedFeaturesHash, true);

  var result = featureCallback(null);
  if (result) {
    return result;
  } else {
    return undefined;
  }
};


ol.render.webgl.Replay.prototype.drawHitDetectionReplayOneByOne_ = goog.abstractMethod;


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
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // bind the indices buffer
  goog.asserts.assert(this.indicesBuffer_,
      'indicesBuffer must not be null');
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  var locations = this.setUpProgram_(gl, context, size, pixelRatio);

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
    if (typeof locations[i] === 'number') {
      gl.disableVertexAttribArray(locations[i]);
    }
  }

  if (this.lineStringReplay_) {
    this.lineStringReplay_.replay(context,
        center, resolution, rotation, size, pixelRatio,
        opacity, skippedFeaturesHash,
        featureCallback, oneByOne, opt_hitExtent);
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
 * @param {number} pixelRatio Pixel ratio.
 * @return {ol.render.webgl.imagereplay.shader.Default.Locations} Locations.
 */
ol.render.webgl.ImageReplay.prototype.setUpProgram_ = function(gl, context, size, pixelRatio) {
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
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayOneByOne_ = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
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
   * @type {Array.<Array.<?>>}
   */
  this.styles_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.styleIndices_ = [];

  /**
   * @private
   * @type {{strokeColor: (Array.<number>|null),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined),
   *         changed: boolean}|null}
   */
  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined,
    changed: false
  };

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
  //ol.render.webgl.lineStringInstruction, and a rounding factor (1 or 2). If the product is even,
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
    p1 = p2 || [flatCoordinates[i], flatCoordinates[i + 1]];
    //First vertex.
    if (i === offset) {
      p2 = [flatCoordinates[i + stride], flatCoordinates[i + stride + 1]];
      if (end - offset === stride * 2 && ol.array.equals(p1, p2)) {
        break;
      }
      if (closed) {
        //A closed line! Complete the circle.
        p0 = [flatCoordinates[end - stride * 2],
            flatCoordinates[end - stride * 2 + 1]];

        startCoords = p2;
      } else {
        //Add the first two/four vertices.

        if (lineCap) {
          numVertices = this.addVertices_([0, 0], p1, p2,
              lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_([0, 0], p1, p2,
              -lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          this.indices_[numIndices++] = n + 2;
          this.indices_[numIndices++] = n;
          this.indices_[numIndices++] = n + 1;

          this.indices_[numIndices++] = n + 1;
          this.indices_[numIndices++] = n + 3;
          this.indices_[numIndices++] = n + 2;

        }

        numVertices = this.addVertices_([0, 0], p1, p2,
            lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_([0, 0], p1, p2,
            -lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        lastIndex = numVertices / 7 - 1;

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
            lastSign * ol.render.webgl.lineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_(p0, p1, [0, 0],
            -lastSign * ol.render.webgl.lineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        this.indices_[numIndices++] = n;
        this.indices_[numIndices++] = lastIndex - 1;
        this.indices_[numIndices++] = lastIndex;

        this.indices_[numIndices++] = lastIndex;
        this.indices_[numIndices++] = n + 1;
        this.indices_[numIndices++] = n;

        if (lineCap) {
          numVertices = this.addVertices_(p0, p1, [0, 0],
              lastSign * ol.render.webgl.lineStringInstruction.END_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_(p0, p1, [0, 0],
              -lastSign * ol.render.webgl.lineStringInstruction.END_LINE_CAP * lineCap, numVertices);

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
      p2 = [flatCoordinates[i + stride], flatCoordinates[i + stride + 1]];
    }

    sign = ol.render.webgl.triangleIsCounterClockwise(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1])
        ? -1 : 1;

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.lineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.lineStringInstruction.BEVEL_SECOND * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.lineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

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
          sign * ol.render.webgl.lineStringInstruction.MITER_TOP * lineJoin, numVertices);

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
        sign * ol.render.webgl.lineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.lineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

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
    flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
        stride, -this.origin_[0], -this.origin_[1]);
    if (this.state_.changed) {
      this.styleIndices_.push(this.indices_.length);
      this.state_.changed = false;
    }
    this.startIndices_.push(this.indices_.length);
    this.startIndicesFeature_.push(feature);
    this.drawCoordinates_(
        flatCoordinates, 0, flatCoordinates.length, stride);
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
      flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
          stride, -this.origin_[0], -this.origin_[1]);
      this.drawCoordinates_(
          flatCoordinates, 0, flatCoordinates.length, stride);
    }
  }
  if (this.indices_.length > indexCount) {
    this.startIndices_.push(indexCount);
    this.startIndicesFeature_.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(indexCount);
      this.state_.changed = false;
    }
  }
};


/**
 * @param {ol.webgl.Context} context Context.
 **/
ol.render.webgl.LineStringReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(this.indices_);
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  this.startIndices_.push(this.indices_.length);

  //Clean up, if there is nothing to draw
  if (this.styleIndices_.length === 0 && this.styles_.length > 0) {
    this.styles_ = [];
  }

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
  goog.asserts.assert(this.verticesBuffer_, 'verticesBuffer must not be null');
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
 * @param {number} pixelRatio Pixel ratio.
 * @return {ol.render.webgl.linestringreplay.shader.Default.Locations} Locations.
 */
ol.render.webgl.LineStringReplay.prototype.setUpProgram_ = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader =
      ol.render.webgl.linestringreplay.shader.DefaultFragment.getInstance();
  vertexShader =
      ol.render.webgl.linestringreplay.shader.DefaultVertex.getInstance();
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations = new ol.render.webgl.linestringreplay.shader.Default
      .Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_lastPos);
  gl.vertexAttribPointer(locations.a_lastPos, 2, ol.webgl.FLOAT,
      false, 28, 0);

  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 28, 8);

  gl.enableVertexAttribArray(locations.a_nextPos);
  gl.vertexAttribPointer(locations.a_nextPos, 2, ol.webgl.FLOAT,
      false, 28, 16);

  gl.enableVertexAttribArray(locations.a_direction);
  gl.vertexAttribPointer(locations.a_direction, 1, ol.webgl.FLOAT,
      false, 28, 24);

  // Enable renderer specific uniforms. If clauses needed, as otherwise the compiler complains.
  gl.uniform2fv(locations.u_size, size);
  gl.uniform1f(locations.u_pixelRatio, pixelRatio);

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
  var tmpDepthFunc = /** @type {number} */ (gl.getParameter(gl.DEPTH_FUNC));
  var tmpDepthMask = /** @type {boolean} */ (gl.getParameter(gl.DEPTH_WRITEMASK));

  if (!hitDetection) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.NOTEQUAL);
  }

  if (!ol.object.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    goog.asserts.assert(this.styles_.length === this.styleIndices_.length,
        'number of styles and styleIndices match');

    //Draw by style groups to minimize drawElements() calls.
    var i, start, end, nextStyle;
    end = this.startIndices_[this.startIndices_.length - 1];
    for (i = this.styleIndices_.length - 1; i >= 0; --i) {
      start = this.styleIndices_[i];
      nextStyle = this.styles_[i];
      this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
      this.drawElements_(gl, context, start, end);
      end = start;
    }
  }
  if (!hitDetection) {
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    //Restore GL parameters.
    gl.depthMask(tmpDepthMask);
    gl.depthFunc(tmpDepthFunc);
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.LineStringReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  goog.asserts.assert(this.startIndices_.length - 1 === this.startIndicesFeature_.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
  featureIndex = this.startIndices_.length - 2;
  end = start = this.startIndices_[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices_[featureIndex] >= groupStart) {
      featureStart = this.startIndices_[featureIndex];
      feature = this.startIndicesFeature_[featureIndex];
      featureUid = goog.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid]) {
        if (start !== end) {
          this.drawElements_(gl, context, start, end);
        }
        end = featureStart;
      }
      featureIndex--;
      start = featureStart;
    }
    if (start !== end) {
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
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.LineStringReplay.prototype.drawHitDetectionReplayOneByOne_ = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  goog.asserts.assert(this.styles_.length === this.styleIndices_.length,
      'number of styles and styleIndices match');
  goog.asserts.assert(this.startIndices_.length - 1 === this.startIndicesFeature_.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
  featureIndex = this.startIndices_.length - 2;
  end = this.startIndices_[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices_[featureIndex] >= groupStart) {
      start = this.startIndices_[featureIndex];
      feature = this.startIndicesFeature_[featureIndex];
      featureUid = goog.getUid(feature).toString();

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
      featureIndex--;
      end = start;
    }
  }
  return undefined;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 * @param {number} lineWidth Line width.
 * @param {number} miterLimit Miter limit.
 */
ol.render.webgl.LineStringReplay.prototype.setStrokeStyle_ = function(gl, color, lineWidth, miterLimit) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
  gl.uniform1f(this.defaultLocations_.u_lineWidth, lineWidth);
  gl.uniform1f(this.defaultLocations_.u_miterLimit, miterLimit);
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
  goog.asserts.assert(!fillStyle, 'fillStyle should be null');
  goog.asserts.assert(strokeStyle, 'strokeStyle should not be null');
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.webgl.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.webgl.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : ol.render.webgl.defaultLineJoin;
  var strokeStyleColor = ol.color.asArray(strokeStyle.getColor()).map(function(c, i) {
    return i != 3 ? c / 255 : c;
  }) || ol.render.webgl.defaultStrokeStyle;
  var strokeStyleWidth = strokeStyle.getWidth();
  strokeStyleWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.webgl.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  strokeStyleMiterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : ol.render.webgl.defaultMiterLimit;
  if (!this.state_.strokeColor || !ol.array.equals(this.state_.strokeColor, strokeStyleColor) ||
      this.state_.lineWidth !== strokeStyleWidth || this.state_.miterLimit !== strokeStyleMiterLimit) {
    this.state_.changed = true;
    this.state_.strokeColor = strokeStyleColor;
    this.state_.lineWidth = strokeStyleWidth;
    this.state_.miterLimit = strokeStyleMiterLimit;
    this.styles_.push([strokeStyleColor, strokeStyleWidth, strokeStyleMiterLimit]);
  }
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

  this.lineStringReplay_ = new ol.render.webgl.LineStringReplay(
      tolerance, maxExtent);

  /**
   * @private
   * @type {ol.render.webgl.polygonreplay.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {Array.<Array.<number>>}
   */
  this.styles_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.styleIndices_ = [];

  /**
   * @private
   * @type {{fillColor: (Array.<number>|null),
   *         changed: boolean}|null}
   */
  this.state_ = {
    fillColor: null,
    changed: false
  };

  /**
   * @private
   */
  this.rtree_ = new ol.structs.RBush();

};
ol.inherits(ol.render.webgl.PolygonReplay, ol.render.webgl.Replay);


/**
 * Draw one polygon.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} holeFlatCoordinates Hole flat coordinates.
 * @param {number} stride Stride.
 * @private
 */
ol.render.webgl.PolygonReplay.prototype.drawCoordinates_ = function(
    flatCoordinates, holeFlatCoordinates, stride) {
  // Triangulate the polygon
  var outerRing = new ol.structs.LinkedList();
  // Initialize the outer ring
  var maxX = this.processFlatCoordinates_(flatCoordinates, stride, outerRing, true);

  // Eliminate holes, if there are any
  if (holeFlatCoordinates.length) {
    var i, ii;
    var holeLists = [];
    for (i = 0, ii = holeFlatCoordinates.length; i < ii; ++i) {
      var holeList = {
        list: new ol.structs.LinkedList(),
        maxX: undefined
      };
      holeLists.push(holeList);
      holeList.maxX = this.processFlatCoordinates_(holeFlatCoordinates[i],
          stride, holeList.list, false);
    }
    holeLists.sort(function(a, b) {
      return b.maxX - a.maxX;
    });
    for (i = 0; i < holeLists.length; ++i) {
      this.bridgeHole_(holeLists[i].list, holeLists[i].maxX, outerRing, maxX);
    }
  }
  this.classifyPoints_(outerRing, false);
  this.triangulate_(outerRing);

  // We clear the R-Tree here, because hit detection does not call finish()
  this.rtree_.clear();
};


/**
 * Inserts flat coordinates in a linked list and adds them to the vertex buffer.
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} stride Stride.
 * @param {ol.structs.LinkedList} list Linked list.
 * @param {boolean} clockwise Coordinate order should be clockwise.
 * @return {number} Maximum X value.
 */
ol.render.webgl.PolygonReplay.prototype.processFlatCoordinates_ = function(
    flatCoordinates, stride, list, clockwise) {
  var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(flatCoordinates,
      0, flatCoordinates.length, stride);
  var i, ii, maxX;
  var n = this.vertices_.length / 2;
  /** @type {ol.WebglPolygonVertex} */
  var start;
  /** @type {ol.WebglPolygonVertex} */
  var p0;
  /** @type {ol.WebglPolygonVertex} */
  var p1;
  var extents = [];
  var segments = [];
  if (clockwise === isClockwise) {
    start = this.createPoint_(flatCoordinates[0], flatCoordinates[1], n++);
    p0 = start;
    maxX = flatCoordinates[0];
    for (i = stride, ii = flatCoordinates.length; i < ii; i += stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
          Math.max(p0.y, p1.y)]);
      maxX = flatCoordinates[i] > maxX ? flatCoordinates[i] : maxX;
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
  } else {
    var end = flatCoordinates.length - stride;
    start = this.createPoint_(flatCoordinates[end], flatCoordinates[end + 1], n++);
    p0 = start;
    maxX = flatCoordinates[end];
    for (i = end - stride, ii = 0; i >= ii; i -= stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
          Math.max(p0.y, p1.y)]);
      maxX = flatCoordinates[i] > maxX ? flatCoordinates[i] : maxX;
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
  }
  this.rtree_.load(extents, segments);

  return maxX;
};


/**
 * Classifies the points of a polygon list as convex, reflex. Removes collinear vertices.
 * @private
 * @param {ol.structs.LinkedList} list Polygon ring.
 * @param {boolean} ccw The orientation of the polygon is counter-clockwise.
 * @return {boolean} There were reclassified points.
 */
ol.render.webgl.PolygonReplay.prototype.classifyPoints_ = function(list, ccw) {
  var start = list.firstItem();
  var s0 = start;
  var s1 = list.nextItem();
  var pointsReclassified = false;
  do {
    var reflex = ccw ? ol.render.webgl.triangleIsCounterClockwise(s1.p1.x,
        s1.p1.y, s0.p1.x, s0.p1.y, s0.p0.x, s0.p0.y) :
        ol.render.webgl.triangleIsCounterClockwise(s0.p0.x, s0.p0.y, s0.p1.x,
        s0.p1.y, s1.p1.x, s1.p1.y);
    if (reflex === undefined) {
      this.removeItem_(s0, s1, list);
      pointsReclassified = true;
      if (s1 === start) {
        start = list.getNextItem();
      }
      s1 = s0;
      list.prevItem();
    } else if (s0.p1.reflex !== reflex) {
      s0.p1.reflex = reflex;
      pointsReclassified = true;
    }
    s0 = s1;
    s1 = list.nextItem();
  } while (s0 !== start);
  return pointsReclassified;
};


/**
 * @private
 * @param {ol.structs.LinkedList} hole Linked list of the hole.
 * @param {number} holeMaxX Maximum X value of the hole.
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {number} listMaxX Maximum X value of the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.bridgeHole_ = function(hole, holeMaxX,
    list, listMaxX) {
  var seg = hole.firstItem();
  while (seg.p1.x !== holeMaxX) {
    seg = hole.nextItem();
  }

  var p1 = seg.p1;
  /** @type {ol.WebglPolygonVertex} */
  var p2 = {x: listMaxX, y: p1.y, i: -1};
  var minDist = Infinity;
  var i, ii, bestPoint;
  /** @type {ol.WebglPolygonVertex} */
  var p5;

  var intersectingSegments = this.getIntersections_({p0: p1, p1: p2}, true);
  for (i = 0, ii = intersectingSegments.length; i < ii; ++i) {
    var currSeg = intersectingSegments[i];
    if (currSeg.p0 !== p1 && currSeg.p1 !== p1) {
      var intersection = this.calculateIntersection_(p1, p2, currSeg.p0,
          currSeg.p1, true);
      var dist = Math.abs(p1.x - intersection[0]);
      if (dist < minDist) {
        minDist = dist;
        p5 = {x: intersection[0], y: intersection[1], i: -1};
        seg = currSeg;
      }
    }
  }
  bestPoint = seg.p1;

  var pointsInTriangle = this.getPointsInTriangle_(p1, p5, seg.p1);
  if (pointsInTriangle.length) {
    var theta = Infinity;
    for (i = 0, ii = pointsInTriangle.length; i < ii; ++i) {
      var currPoint = pointsInTriangle[i];
      var currTheta = Math.atan2(p1.y - currPoint.y, p2.x - currPoint.x);
      if (currTheta < theta || (currTheta === theta && currPoint.x < bestPoint.x)) {
        theta = currTheta;
        bestPoint = currPoint;
      }
    }
  }

  seg = list.firstItem();
  while (seg.p1 !== bestPoint) {
    seg = list.nextItem();
  }

  //We clone the bridge points as they can have different convexity.
  var p0Bridge = {x: p1.x, y: p1.y, i: p1.i, reflex: undefined};
  var p1Bridge = {x: seg.p1.x, y: seg.p1.y, i: seg.p1.i, reflex: undefined};

  hole.getNextItem().p0 = p0Bridge;
  this.insertItem_(p1, seg.p1, hole, true);
  this.insertItem_(p1Bridge, p0Bridge, hole, true);
  seg.p1 = p1Bridge;
  hole.setFirstItem();
  list.concat(hole);
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.triangulate_ = function(list) {
  var ccw = false;
  var simple = this.isSimple_(list);
  var pass = 0;

  // Start clipping ears
  while (list.getLength() > 3) {
    if (simple) {
      if (!this.clipEars_(list, simple, ccw)) {
        if (!this.classifyPoints_(list, ccw)) {
          // We have the wrongly oriented remains of a self-intersecting polygon.
          pass++;
          if (pass > 1) {
            // Something went wrong.
            break;
          }
          ccw = !ccw;
          this.classifyPoints_(list, ccw);
        }
      }
    } else {
      if (!this.clipEars_(list, simple, ccw)) {
        // We ran out of ears, try to reclassify.
        if (!this.classifyPoints_(list, ccw)) {
          // We have a bad polygon, try to resolve local self-intersections.
          if (!this.resolveLocalSelfIntersections_(list)) {
            simple = this.isSimple_(list);
            if (!simple) {
              // We have a really bad polygon, try more time consuming methods.
              break;
            }
          }
        }
      }
    }
  }
  if (list.getLength() === 3) {
    var numIndices = this.indices_.length;
    this.indices_[numIndices++] = list.getPrevItem().p0.i;
    this.indices_[numIndices++] = list.getCurrItem().p0.i;
    this.indices_[numIndices++] = list.getNextItem().p0.i;
  }
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {boolean} simple The polygon is simple.
 * @param {boolean} ccw Orientation of the polygon is counter-clockwise.
 * @return {boolean} There were processed ears.
 */
ol.render.webgl.PolygonReplay.prototype.clipEars_ = function(list, simple, ccw) {
  var numIndices = this.indices_.length;
  var start = list.firstItem();
  var s0 = list.getPrevItem();
  var s1 = start;
  var s2 = list.nextItem();
  var s3 = list.getNextItem();
  var p0, p1, p2;
  var processedEars = false;
  do {
    p0 = s1.p0;
    p1 = s1.p1;
    p2 = s2.p1;
    if (p1.reflex === false) {
      // We might have a valid ear
      var diagonalIsInside = ccw ? this.diagonalIsInside_(s3.p1, p2, p1, p0,
          s0.p0) : this.diagonalIsInside_(s0.p0, p0, p1, p2, s3.p1);
      if ((simple || this.getIntersections_({p0: p0, p1: p2}).length === 0) &&
          diagonalIsInside && this.getPointsInTriangle_(p0, p1, p2, true).length === 0) {
        //The diagonal is completely inside the polygon
        if (p0.reflex === false || p2.reflex === false ||
            ol.geom.flat.orient.linearRingIsClockwise([s0.p0.x, s0.p0.y, p0.x,
            p0.y, p1.x, p1.y, p2.x, p2.y, s3.p1.x, s3.p1.y], 0, 10, 2) === !ccw) {
          //The diagonal is persumably valid, we have an ear
          this.indices_[numIndices++] = p0.i;
          this.indices_[numIndices++] = p1.i;
          this.indices_[numIndices++] = p2.i;
          this.removeItem_(s1, s2, list);
          if (s2 === start) {
            start = s3;
          }
          processedEars = true;
        }
      }
    }
    // Else we have a reflex point.
    s0 = list.getPrevItem();
    s1 = list.getCurrItem();
    s2 = list.nextItem();
    s3 = list.getNextItem();
  } while (s1 !== start && list.getLength() > 3);

  return processedEars;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @return {boolean} There were resolved intersections.
*/
ol.render.webgl.PolygonReplay.prototype.resolveLocalSelfIntersections_ = function(
    list) {
  var start = list.firstItem();
  list.nextItem();
  var s0 = start;
  var s1 = list.nextItem();
  var resolvedIntersections = false;

  do {
    var intersection = this.calculateIntersection_(s0.p0, s0.p1, s1.p0, s1.p1);
    if (intersection) {
      var numVertices = this.vertices_.length;
      var numIndices = this.indices_.length;
      var n = numVertices / 2;
      var p = this.createPoint_(intersection[0], intersection[1], n);

      var seg = list.prevItem();
      list.removeItem();
      this.rtree_.remove(seg);
      s0.p1 = p;
      s1.p0 = p;
      this.rtree_.update([Math.min(s0.p0.x, s0.p1.x), Math.min(s0.p0.y, s0.p1.y),
          Math.max(s0.p0.x, s0.p1.x), Math.max(s0.p0.y, s0.p1.y)], s0);
      this.rtree_.update([Math.min(s1.p0.x, s1.p1.x), Math.min(s1.p0.y, s1.p1.y),
          Math.max(s1.p0.x, s1.p1.x), Math.max(s1.p0.y, s1.p1.y)], s1);
      this.indices_[numIndices++] = seg.p0.i;
      this.indices_[numIndices++] = seg.p1.i;
      this.indices_[numIndices++] = p.i;

      resolvedIntersections = true;
      if (start === seg) {
        break;
      }
    }

    s0 = list.getPrevItem();
    s1 = list.nextItem();
  } while (s0 !== start);
  return resolvedIntersections;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @return {boolean} The polygon is simple.
 */
ol.render.webgl.PolygonReplay.prototype.isSimple_ = function(list) {
  var start = list.firstItem();
  var seg = start;
  do {
    if (this.getIntersections_(seg).length) {
      return false;
    }
    seg = list.nextItem();
  } while (seg !== start);
  return true;
};


/**
 * @private
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @param {number} i Index.
 * @return {ol.WebglPolygonVertex} List item.
 */
ol.render.webgl.PolygonReplay.prototype.createPoint_ = function(x, y, i) {
  var numVertices = this.vertices_.length;
  this.vertices_[numVertices++] = x;
  this.vertices_[numVertices++] = y;
  /** @type {ol.WebglPolygonVertex} */
  var p = {
    x: x,
    y: y,
    i: i,
    reflex: undefined
  };
  return p;
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point of segment.
 * @param {ol.WebglPolygonVertex} p1 Second point of segment.
 * @param {ol.structs.LinkedList} list Polygon ring.
 * @param {boolean=} opt_rtree Insert the segment into the R-Tree.
 * @return {Object.<string, ol.WebglPolygonVertex>} segment.
 */
ol.render.webgl.PolygonReplay.prototype.insertItem_ = function(p0, p1, list, opt_rtree) {
  var seg = {
    p0: p0,
    p1: p1
  };
  list.insertItem(seg);
  if (opt_rtree) {
    this.rtree_.insert([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y),
        Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)], seg);
  }
  return seg;
};


 /**
  * @private
  * @param {Object.<string, ol.WebglPolygonVertex>} s0 Segment before the remove candidate.
  * @param {Object.<string, ol.WebglPolygonVertex>} s1 Remove candidate segment.
  * @param {ol.structs.LinkedList} list Polygon ring.
  */
ol.render.webgl.PolygonReplay.prototype.removeItem_ = function(s0, s1, list) {
  list.removeItem();
  s0.p1 = s1.p1;
  this.rtree_.remove(s1);
  this.rtree_.update([Math.min(s0.p0.x, s0.p1.x), Math.min(s0.p0.y, s0.p1.y),
      Math.max(s0.p0.x, s0.p1.x), Math.max(s0.p0.y, s0.p1.y)], s0);
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point.
 * @param {ol.WebglPolygonVertex} p1 Second point.
 * @param {ol.WebglPolygonVertex} p2 Third point.
 * @param {boolean=} opt_reflex Only include reflex points.
 * @return {Array.<Object.<string, number>>} Points in the triangle.
 */
ol.render.webgl.PolygonReplay.prototype.getPointsInTriangle_ = function(p0, p1,
    p2, opt_reflex) {
  var i, ii, j, p;
  var result = [];
  var segmentsInExtent = this.rtree_.getInExtent([Math.min(p0.x, p1.x, p2.x),
      Math.min(p0.y, p1.y, p2.y), Math.max(p0.x, p1.x, p2.x), Math.max(p0.y,
      p1.y, p2.y)]);
  for (i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    for (j in segmentsInExtent[i]) {
      p = segmentsInExtent[i][j];
      if (p.x && p.y && (!opt_reflex || p.reflex)) {
        if ((p.x !== p0.x || p.y !== p0.y) && (p.x !== p1.x || p.y !== p1.y) &&
            (p.x !== p2.x || p.y !== p2.y) && result.indexOf(p) === -1 &&
            ol.geom.flat.contains.linearRingContainsXY([p0.x, p0.y, p1.x, p1.y,
            p2.x, p2.y], 0, 6, 2, p.x, p.y)) {
          result.push(p);
        }
      }
    }
  }
  return result;
};


/**
 * @private
 * @param {Object.<string, ol.WebglPolygonVertex>} segment Segment.
 * @param {boolean=} opt_touch Touching segments should be considered an intersection.
 * @return {Array.<Object.<string, ol.WebglPolygonVertex>>} Intersecting segments.
 */
ol.render.webgl.PolygonReplay.prototype.getIntersections_ = function(segment, opt_touch) {
  var p0 = segment.p0;
  var p1 = segment.p1;
  var segmentsInExtent = this.rtree_.getInExtent([Math.min(p0.x, p1.x),
      Math.min(p0.y, p1.y), Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)]);
  var result = [];
  var i, ii;
  for (i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    var currSeg = segmentsInExtent[i];
    if (segment !== currSeg && (opt_touch || currSeg.p0 !== p1 || currSeg.p1 !== p0) &&
        this.calculateIntersection_(p0, p1, currSeg.p0, currSeg.p1, opt_touch)) {
      result.push(currSeg);
    }
  }
  return result;
};


/**
 * Line intersection algorithm by Paul Bourke.
 * @see http://paulbourke.net/geometry/pointlineplane/
 *
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point.
 * @param {ol.WebglPolygonVertex} p1 Second point.
 * @param {ol.WebglPolygonVertex} p2 Third point.
 * @param {ol.WebglPolygonVertex} p3 Fourth point.
 * @param {boolean=} opt_touch Touching segments should be considered an intersection.
 * @return {Array.<number>|undefined} Intersection coordinates.
 */
ol.render.webgl.PolygonReplay.prototype.calculateIntersection_ = function(p0,
    p1, p2, p3, opt_touch) {
  var denom = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
  if (denom !== 0) {
    var ua = ((p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x)) / denom;
    var ub = ((p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x)) / denom;
    if ((!opt_touch && ua > ol.render.webgl.EPSILON && ua < 1 - ol.render.webgl.EPSILON &&
        ub > ol.render.webgl.EPSILON && ub < 1 - ol.render.webgl.EPSILON) || (opt_touch &&
        ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)) {
      return [p0.x + ua * (p1.x - p0.x), p0.y + ua * (p1.y - p0.y)];
    }
  }
  return undefined;
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 Point before the start of the diagonal.
 * @param {ol.WebglPolygonVertex} p1 Start point of the diagonal.
 * @param {ol.WebglPolygonVertex} p2 Ear candidate.
 * @param {ol.WebglPolygonVertex} p3 End point of the diagonal.
 * @param {ol.WebglPolygonVertex} p4 Point after the end of the diagonal.
 * @return {boolean} Diagonal is inside the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.diagonalIsInside_ = function(p0, p1, p2, p3, p4) {
  if (p1.reflex === undefined || p3.reflex === undefined) {
    return false;
  }
  var p1IsLeftOf = (p2.x - p3.x) * (p1.y - p3.y) > (p2.y - p3.y) * (p1.x - p3.x);
  var p1IsRightOf = (p4.x - p3.x) * (p1.y - p3.y) < (p4.y - p3.y) * (p1.x - p3.x);
  var p3IsLeftOf = (p0.x - p1.x) * (p3.y - p1.y) > (p0.y - p1.y) * (p3.x - p1.x);
  var p3IsRightOf = (p2.x - p1.x) * (p3.y - p1.y) < (p2.y - p1.y) * (p3.x - p1.x);
  var p1InCone = p3.reflex ? p1IsRightOf || p1IsLeftOf : p1IsRightOf && p1IsLeftOf;
  var p3InCone = p1.reflex ? p3IsRightOf || p3IsLeftOf : p3IsRightOf && p3IsLeftOf;
  return p1InCone && p3InCone;
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
  var polygons = multiPolygonGeometry.getPolygons();
  var stride = multiPolygonGeometry.getStride();
  var currIndex = this.indices_.length;
  var currLineIndex = this.lineStringReplay_.indices_.length;
  var i, ii, j, jj;
  for (i = 0, ii = polygons.length; i < ii; ++i) {
    var linearRings = polygons[i].getLinearRings();
    if (linearRings.length > 0) {
      var flatCoordinates = linearRings[0].getFlatCoordinates();
      flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
          stride, -this.origin_[0], -this.origin_[1]);
      this.lineStringReplay_.drawCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
      var holes = [];
      var holeFlatCoords;
      for (j = 1, jj = linearRings.length; j < jj; ++j) {
        holeFlatCoords = linearRings[j].getFlatCoordinates();
        holeFlatCoords = ol.geom.flat.transform.translate(holeFlatCoords, 0, holeFlatCoords.length,
            stride, -this.origin_[0], -this.origin_[1]);
        holes.push(holeFlatCoords);
        this.lineStringReplay_.drawCoordinates_(holeFlatCoords, 0, holeFlatCoords.length, stride);
      }
      this.drawCoordinates_(flatCoordinates, holes, stride);
    }
  }
  if (this.indices_.length > currIndex) {
    this.startIndices_.push(currIndex);
    this.startIndicesFeature_.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(currIndex);
      this.state_.changed = false;
    }
  }
  if (this.lineStringReplay_.indices_.length > currLineIndex) {
    this.lineStringReplay_.startIndices_.push(currLineIndex);
    this.lineStringReplay_.startIndicesFeature_.push(feature);
    if (this.lineStringReplay_.state_.changed) {
      this.lineStringReplay_.styleIndices_.push(currLineIndex);
      this.lineStringReplay_.state_.changed = false;
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawPolygon = function(polygonGeometry, feature) {
  var linearRings = polygonGeometry.getLinearRings();
  var stride = polygonGeometry.getStride();
  if (linearRings.length > 0) {
    this.startIndices_.push(this.indices_.length);
    this.startIndicesFeature_.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(this.indices_.length);
      this.state_.changed = false;
    }

    this.lineStringReplay_.startIndices_.push(this.lineStringReplay_.indices_.length);
    this.lineStringReplay_.startIndicesFeature_.push(feature);
    if (this.lineStringReplay_.state_.changed) {
      this.lineStringReplay_.styleIndices_.push(this.lineStringReplay_.indices_.length);
      this.lineStringReplay_.state_.changed = false;
    }

    var flatCoordinates = linearRings[0].getFlatCoordinates();
    flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
        stride, -this.origin_[0], -this.origin_[1]);
    this.lineStringReplay_.drawCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
    var holes = [];
    var i, ii, holeFlatCoords;
    for (i = 1, ii = linearRings.length; i < ii; ++i) {
      holeFlatCoords = linearRings[i].getFlatCoordinates();
      holeFlatCoords = ol.geom.flat.transform.translate(holeFlatCoords, 0, holeFlatCoords.length,
          stride, -this.origin_[0], -this.origin_[1]);
      holes.push(holeFlatCoords);
      this.lineStringReplay_.drawCoordinates_(holeFlatCoords, 0, holeFlatCoords.length, stride);
    }
    this.drawCoordinates_(flatCoordinates, holes, stride);
  }
};


/**
 * @param {ol.webgl.Context} context Context.
 **/
ol.render.webgl.PolygonReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(this.indices_);
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  this.startIndices_.push(this.indices_.length);

  this.lineStringReplay_.finish(context);

  //Clean up, if there is nothing to draw
  if (this.styleIndices_.length === 0 && this.styles_.length > 0) {
    this.styles_ = [];
  }

  this.vertices_ = null;
  this.indices_ = null;
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
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @return {ol.render.webgl.polygonreplay.shader.Default.Locations} Locations.
 */
ol.render.webgl.PolygonReplay.prototype.setUpProgram_ = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader =
      ol.render.webgl.polygonreplay.shader.DefaultFragment.getInstance();
  vertexShader =
      ol.render.webgl.polygonreplay.shader.DefaultVertex.getInstance();
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations = new ol.render.webgl.polygonreplay.shader.Default
      .Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 8, 0);

  return locations;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
ol.render.webgl.PolygonReplay.prototype.drawReplay_ = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Save GL parameters.
  var tmpDepthFunc = /** @type {number} */ (gl.getParameter(gl.DEPTH_FUNC));
  var tmpDepthMask = /** @type {boolean} */ (gl.getParameter(gl.DEPTH_WRITEMASK));

  if (!hitDetection) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.NOTEQUAL);
  }

  if (!ol.object.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    goog.asserts.assert(this.styles_.length === this.styleIndices_.length,
        'number of styles and styleIndices match');

    //Draw by style groups to minimize drawElements() calls.
    var i, start, end, nextStyle;
    end = this.startIndices_[this.startIndices_.length - 1];
    for (i = this.styleIndices_.length - 1; i >= 0; --i) {
      start = this.styleIndices_[i];
      nextStyle = this.styles_[i];
      this.setFillStyle_(gl, nextStyle);
      this.drawElements_(gl, context, start, end);
      end = start;
    }
  }
  if (!hitDetection) {
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    //Restore GL parameters.
    gl.depthMask(tmpDepthMask);
    gl.depthFunc(tmpDepthFunc);
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
ol.render.webgl.PolygonReplay.prototype.drawHitDetectionReplayOneByOne_ = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  goog.asserts.assert(this.styles_.length === this.styleIndices_.length,
      'number of styles and styleIndices match');
  goog.asserts.assert(this.startIndices_.length - 1 === this.startIndicesFeature_.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
  featureIndex = this.startIndices_.length - 2;
  end = this.startIndices_[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, nextStyle);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices_[featureIndex] >= groupStart) {
      start = this.startIndices_[featureIndex];
      feature = this.startIndicesFeature_[featureIndex];
      featureUid = goog.getUid(feature).toString();

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
      featureIndex--;
      end = start;
    }
  }
  return undefined;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.PolygonReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  goog.asserts.assert(this.startIndices_.length - 1 === this.startIndicesFeature_.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
  featureIndex = this.startIndices_.length - 2;
  end = start = this.startIndices_[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, nextStyle);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices_[featureIndex] >= groupStart) {
      featureStart = this.startIndices_[featureIndex];
      feature = this.startIndicesFeature_[featureIndex];
      featureUid = goog.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid]) {
        if (start !== end) {
          this.drawElements_(gl, context, start, end);
        }
        end = featureStart;
      }
      featureIndex--;
      start = featureStart;
    }
    if (start !== end) {
      this.drawElements_(gl, context, start, end);
    }
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 */
ol.render.webgl.PolygonReplay.prototype.setFillStyle_ = function(gl, color) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
};


/**
 * @inheritDoc
 */

ol.render.webgl.PolygonReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
  goog.asserts.assert(fillStyle || strokeStyle, 'one of the styles should not be null');
  var fillStyleColor = fillStyle ? fillStyle.getColor() : [0, 0, 0, 0];
  if (!(fillStyleColor instanceof CanvasGradient) &&
      !(fillStyleColor instanceof CanvasPattern)) {
    fillStyleColor = ol.color.asArray(fillStyleColor).map(function(c, i) {
      return i != 3 ? c / 255 : c;
    }) || ol.render.webgl.defaultFillStyle;
  } else {
    fillStyleColor = ol.render.webgl.defaultFillStyle;
  }
  if (!this.state_.fillColor || !ol.array.equals(fillStyleColor, this.state_.fillColor)) {
    this.state_.fillColor = fillStyleColor;
    this.state_.changed = true;
    this.styles_.push(fillStyleColor);
  }
  //Provide a null stroke style, if no strokeStyle is provided. Required for the draw interaction to work.
  if (strokeStyle) {
    this.lineStringReplay_.setFillStrokeStyle(null, strokeStyle);
  } else {
    var nullStrokeStyle = new ol.style.Stroke({
      color: [0, 0, 0, 0],
      lineWidth: 0
    });
    this.lineStringReplay_.setFillStrokeStyle(null, nullStrokeStyle);
  }
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
  'LineString': ol.render.webgl.LineStringReplay,
  'Polygon': ol.render.webgl.PolygonReplay
};


/**
 * @const
 * @private
 * @type {Array.<number>}
 */
ol.render.webgl.HIT_DETECTION_SIZE_ = [1, 1];
