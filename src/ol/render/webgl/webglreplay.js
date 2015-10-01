goog.provide('ol.render.webgl.ImageReplay');
goog.provide('ol.render.webgl.ReplayGroup');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.extent');
goog.require('ol.render.IReplayGroup');
goog.require('ol.render.VectorContext');
goog.require('ol.render.webgl.imagereplay.shader.Default');
goog.require('ol.render.webgl.imagereplay.shader.Default.Locations');
goog.require('ol.render.webgl.imagereplay.shader.DefaultFragment');
goog.require('ol.render.webgl.imagereplay.shader.DefaultVertex');
goog.require('ol.vec.Mat4');
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
ol.render.webgl.ImageReplay = function(tolerance, maxExtent) {
  goog.base(this);

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
   * @type {ol.render.webgl.imagereplay.shader.Default.Locations}
   */
  this.defaultLocations_ = null;

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
   * @type {Array.<WebGLTexture>}
   * @private
   */
  this.hitDetectionTextures_ = [];

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
   * @type {Array.<ol.Feature>}
   * @private
   */
  this.startIndicesFeature_ = [];

  /**
   * @type {number|undefined}
   * @private
   */
  this.width_ = undefined;
};
goog.inherits(ol.render.webgl.ImageReplay, ol.render.VectorContext);


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction =
    function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other ImageReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  goog.asserts.assert(this.verticesBuffer_,
      'verticesBuffer must not be null');
  goog.asserts.assert(this.indicesBuffer_,
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
  goog.asserts.assert(this.anchorX_ !== undefined, 'anchorX is defined');
  goog.asserts.assert(this.anchorY_ !== undefined, 'anchorY is defined');
  goog.asserts.assert(this.height_ !== undefined, 'height is defined');
  goog.asserts.assert(this.imageHeight_ !== undefined,
      'imageHeight is defined');
  goog.asserts.assert(this.imageWidth_ !== undefined, 'imageWidth is defined');
  goog.asserts.assert(this.opacity_ !== undefined, 'opacity is defined');
  goog.asserts.assert(this.originX_ !== undefined, 'originX is defined');
  goog.asserts.assert(this.originY_ !== undefined, 'originY is defined');
  goog.asserts.assert(this.rotateWithView_ !== undefined,
      'rotateWithView is defined');
  goog.asserts.assert(this.rotation_ !== undefined, 'rotation is defined');
  goog.asserts.assert(this.scale_ !== undefined, 'scale is defined');
  goog.asserts.assert(this.width_ !== undefined, 'width is defined');
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
ol.render.webgl.ImageReplay.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, feature) {
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
ol.render.webgl.ImageReplay.prototype.drawPointGeometry =
    function(pointGeometry, feature) {
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
  goog.asserts.assert(this.images_.length === this.groupIndices_.length,
      'number of images and groupIndices match');
  this.hitDetectionGroupIndices_.push(this.indices_.length);
  goog.asserts.assert(this.hitDetectionImages_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionImages and hitDetectionGroupIndices match');

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

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures_(this.textures_, this.images_, texturePerImage, gl);
  goog.asserts.assert(this.textures_.length === this.groupIndices_.length,
      'number of textures and groupIndices match');

  this.createTextures_(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);
  goog.asserts.assert(this.hitDetectionTextures_.length ===
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
ol.render.webgl.ImageReplay.prototype.createTextures_ =
    function(textures, images, texturePerImage, gl) {
  goog.asserts.assert(textures.length === 0,
      'upon creation, textures is empty');

  var texture, image, uid, i;
  var ii = images.length;
  for (i = 0; i < ii; ++i) {
    image = images[i];

    uid = goog.getUid(image).toString();
    if (goog.object.containsKey(texturePerImage, uid)) {
      texture = texturePerImage[uid];
    } else {
      texture = ol.webgl.Context.createTexture(
          gl, image, goog.webgl.CLAMP_TO_EDGE, goog.webgl.CLAMP_TO_EDGE);
      texturePerImage[uid] = texture;
    }
    textures[i] = texture;
  }
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
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.replay = function(context,
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
      'indecesBuffer must not be null');
  context.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  // get the program
  var fragmentShader =
      ol.render.webgl.imagereplay.shader.DefaultFragment.getInstance();
  var vertexShader =
      ol.render.webgl.imagereplay.shader.DefaultVertex.getInstance();
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations =
        new ol.render.webgl.imagereplay.shader.Default.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  // use the program (FIXME: use the return value)
  context.useProgram(program);

  // enable the vertex attrib arrays
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

  // set the "uniform" values
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

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false, offsetScaleMatrix);
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
      offsetRotateMatrix);
  gl.uniform1f(locations.u_opacity, opacity);

  // draw!
  var result;
  if (featureCallback === undefined) {
    this.drawReplay_(gl, context, skippedFeaturesHash,
        this.textures_, this.groupIndices_);
  } else {
    // draw feature by feature for the hit-detection
    result = this.drawHitDetectionReplay_(gl, context, skippedFeaturesHash,
        featureCallback, oneByOne, opt_hitExtent);
  }

  // disable the vertex attrib arrays
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_offsets);
  gl.disableVertexAttribArray(locations.a_texCoord);
  gl.disableVertexAttribArray(locations.a_opacity);
  gl.disableVertexAttribArray(locations.a_rotateWithView);

  return result;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<number>} groupIndices Texture group indices.
 */
ol.render.webgl.ImageReplay.prototype.drawReplay_ =
    function(gl, context, skippedFeaturesHash, textures, groupIndices) {
  goog.asserts.assert(textures.length === groupIndices.length,
      'number of textures and groupIndeces match');
  var elementType = context.hasOESElementIndexUint ?
      goog.webgl.UNSIGNED_INT : goog.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  if (!goog.object.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(
        gl, skippedFeaturesHash, textures, groupIndices,
        elementType, elementSize);
  } else {
    var i, ii, start;
    for (i = 0, ii = textures.length, start = 0; i < ii; ++i) {
      gl.bindTexture(goog.webgl.TEXTURE_2D, textures[i]);
      var end = groupIndices[i];
      this.drawElements_(gl, start, end, elementType, elementSize);
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
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<number>} groupIndices Texture group indices.
 * @param {number} elementType Element type.
 * @param {number} elementSize Element Size.
 */
ol.render.webgl.ImageReplay.prototype.drawReplaySkipping_ =
    function(gl, skippedFeaturesHash, textures, groupIndices,
    elementType, elementSize) {
  var featureIndex = 0;

  var i, ii;
  for (i = 0, ii = textures.length; i < ii; ++i) {
    gl.bindTexture(goog.webgl.TEXTURE_2D, textures[i]);
    var groupStart = (i > 0) ? groupIndices[i - 1] : 0;
    var groupEnd = groupIndices[i];

    var start = groupStart;
    var end = groupStart;
    while (featureIndex < this.startIndices_.length &&
        this.startIndices_[featureIndex] <= groupEnd) {
      var feature = this.startIndicesFeature_[featureIndex];

      var featureUid = goog.getUid(feature).toString();
      if (skippedFeaturesHash[featureUid] !== undefined) {
        // feature should be skipped
        if (start !== end) {
          // draw the features so far
          this.drawElements_(gl, start, end, elementType, elementSize);
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
      this.drawElements_(gl, start, end, elementType, elementSize);
    }
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {number} start Start index.
 * @param {number} end End index.
 * @param {number} elementType Element type.
 * @param {number} elementSize Element Size.
 */
ol.render.webgl.ImageReplay.prototype.drawElements_ = function(
    gl, start, end, elementType, elementSize) {
  var numItems = end - start;
  var offsetInBytes = start * elementSize;
  gl.drawElements(goog.webgl.TRIANGLES, numItems, elementType, offsetInBytes);
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplay_ =
    function(gl, context, skippedFeaturesHash, featureCallback, oneByOne,
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
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayAll_ =
    function(gl, context, skippedFeaturesHash, featureCallback) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.drawReplay_(gl, context, skippedFeaturesHash,
      this.hitDetectionTextures_, this.hitDetectionGroupIndices_);

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
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayOneByOne_ =
    function(gl, context, skippedFeaturesHash, featureCallback,
    opt_hitExtent) {
  goog.asserts.assert(this.hitDetectionTextures_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionTextures and hitDetectionGroupIndices match');
  var elementType = context.hasOESElementIndexUint ?
      goog.webgl.UNSIGNED_INT : goog.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  var i, groupStart, start, end, feature, featureUid;
  var featureIndex = this.startIndices_.length - 1;
  for (i = this.hitDetectionTextures_.length - 1; i >= 0; --i) {
    gl.bindTexture(goog.webgl.TEXTURE_2D, this.hitDetectionTextures_[i]);
    groupStart = (i > 0) ? this.hitDetectionGroupIndices_[i - 1] : 0;
    end = this.hitDetectionGroupIndices_[i];

    // draw all features for this texture group
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
        this.drawElements_(gl, start, end, elementType, elementSize);

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
 */
ol.render.webgl.ImageReplay.prototype.setFillStrokeStyle = goog.abstractMethod;


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
  goog.asserts.assert(anchor, 'imageStyle anchor is not null');
  goog.asserts.assert(image, 'imageStyle image is not null');
  goog.asserts.assert(imageSize,
      'imageStyle imageSize is not null');
  goog.asserts.assert(hitDetectionImage,
      'imageStyle hitDetectionImage is not null');
  goog.asserts.assert(hitDetectionImageSize,
      'imageStyle hitDetectionImageSize is not null');
  goog.asserts.assert(opacity !== undefined, 'imageStyle opacity is defined');
  goog.asserts.assert(origin, 'imageStyle origin is not null');
  goog.asserts.assert(rotateWithView !== undefined,
      'imageStyle rotateWithView is defined');
  goog.asserts.assert(rotation !== undefined, 'imageStyle rotation is defined');
  goog.asserts.assert(size, 'imageStyle size is not null');
  goog.asserts.assert(scale !== undefined, 'imageStyle scale is defined');

  var currentImage;
  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    currentImage = this.images_[this.images_.length - 1];
    if (goog.getUid(currentImage) != goog.getUid(image)) {
      this.groupIndices_.push(this.indices_.length);
      goog.asserts.assert(this.groupIndices_.length === this.images_.length,
          'number of groupIndices and images match');
      this.images_.push(image);
    }
  }

  if (this.hitDetectionImages_.length === 0) {
    this.hitDetectionImages_.push(hitDetectionImage);
  } else {
    currentImage =
        this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
    if (goog.getUid(currentImage) != goog.getUid(hitDetectionImage)) {
      this.hitDetectionGroupIndices_.push(this.indices_.length);
      goog.asserts.assert(this.hitDetectionGroupIndices_.length ===
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
 * @implements {ol.render.IReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @param {number=} opt_renderBuffer Render buffer.
 * @struct
 */
ol.render.webgl.ReplayGroup = function(
    tolerance, maxExtent, opt_renderBuffer) {

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
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.ImageReplay>}
   * @private
   */
  this.replays_ = {};

};


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.ReplayGroup.prototype.getDeleteResourcesFunction =
    function(context) {
  var functions = [];
  var replayKey;
  for (replayKey in this.replays_) {
    functions.push(
        this.replays_[replayKey].getDeleteResourcesFunction(context));
  }
  return goog.functions.sequence.apply(null, functions);
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
  if (replay === undefined) {
    var constructor = ol.render.webgl.BATCH_CONSTRUCTORS_[replayType];
    goog.asserts.assert(constructor !== undefined,
        replayType +
        ' constructor missing from ol.render.webgl.BATCH_CONSTRUCTORS_');
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
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 */
ol.render.webgl.ReplayGroup.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash) {
  var i, ii, replay;
  for (i = 0, ii = ol.render.REPLAY_ORDER.length; i < ii; ++i) {
    replay = this.replays_[ol.render.REPLAY_ORDER[i]];
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
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
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
  for (i = ol.render.REPLAY_ORDER.length - 1; i >= 0; --i) {
    replay = this.replays_[ol.render.REPLAY_ORDER[i]];
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
 * @param {function(ol.Feature): T|undefined} callback Feature callback.
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
       * @param {ol.Feature} feature Feature.
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
       * @param {ol.Feature} feature Feature.
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
 *                function(new: ol.render.webgl.ImageReplay, number,
 *                ol.Extent)>}
 */
ol.render.webgl.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.webgl.ImageReplay
};


/**
 * @const
 * @private
 * @type {Array.<number>}
 */
ol.render.webgl.HIT_DETECTION_SIZE_ = [1, 1];
