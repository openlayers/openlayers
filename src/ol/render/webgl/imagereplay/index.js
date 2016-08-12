goog.provide('ol.render.webgl.ImageReplay');
goog.provide('ol.render.webgl.ReplayGroup');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.render.ReplayGroup');
goog.require('ol.render.VectorContext');
goog.require('ol.render.replay');
goog.require('ol.render.webgl.imagereplay.defaultshader');
goog.require('ol.transform');
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
ol.render.webgl.ImageReplay = function(tolerance, maxExtent) {
  ol.render.VectorContext.call(this);

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
   * @type {ol.render.webgl.imagereplay.defaultshader.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.opacity_ = undefined;

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
   * @type {ol.Transform}
   * @private
   */
  this.projectionMatrix_ = ol.transform.create();

  /**
   * @type {Array.<number>}
   * @private
   */
  this.tmpMat4_ = ol.vec.Mat4.create();

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
   * @type {Array.<ol.Feature|ol.render.Feature>}
   * @private
   */
  this.startIndicesFeature_ = [];

  /**
   * @type {number|undefined}
   * @private
   */
  this.width_ = undefined;
};
ol.inherits(ol.render.webgl.ImageReplay, ol.render.VectorContext);


/**
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other ImageReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  goog.DEBUG && console.assert(this.verticesBuffer_,
      'verticesBuffer must not be null');
  goog.DEBUG && console.assert(this.indicesBuffer_,
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
  goog.DEBUG && console.assert(this.anchorX_ !== undefined, 'anchorX is defined');
  goog.DEBUG && console.assert(this.anchorY_ !== undefined, 'anchorY is defined');
  goog.DEBUG && console.assert(this.height_ !== undefined, 'height is defined');
  goog.DEBUG && console.assert(this.imageHeight_ !== undefined,
      'imageHeight is defined');
  goog.DEBUG && console.assert(this.imageWidth_ !== undefined, 'imageWidth is defined');
  goog.DEBUG && console.assert(this.opacity_ !== undefined, 'opacity is defined');
  goog.DEBUG && console.assert(this.originX_ !== undefined, 'originX is defined');
  goog.DEBUG && console.assert(this.originY_ !== undefined, 'originY is defined');
  goog.DEBUG && console.assert(this.rotateWithView_ !== undefined,
      'rotateWithView is defined');
  goog.DEBUG && console.assert(this.rotation_ !== undefined, 'rotation is defined');
  goog.DEBUG && console.assert(this.scale_ !== undefined, 'scale is defined');
  goog.DEBUG && console.assert(this.width_ !== undefined, 'width is defined');
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
  goog.DEBUG && console.assert(this.images_.length === this.groupIndices_.length,
      'number of images and groupIndices match');
  this.hitDetectionGroupIndices_.push(this.indices_.length);
  goog.DEBUG && console.assert(this.hitDetectionImages_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionImages and hitDetectionGroupIndices match');

  // create, bind, and populate the vertices buffer
  this.verticesBuffer_ = new ol.webgl.Buffer(this.vertices_);
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  var indices = this.indices_;
  var bits = context.hasOESElementIndexUint ? 32 : 16;
  goog.DEBUG && console.assert(indices[indices.length - 1] < Math.pow(2, bits),
      'Too large element index detected [%s] (OES_element_index_uint "%s")',
      indices[indices.length - 1], context.hasOESElementIndexUint);

  // create, bind, and populate the indices buffer
  this.indicesBuffer_ = new ol.webgl.Buffer(indices);
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures_(this.textures_, this.images_, texturePerImage, gl);
  goog.DEBUG && console.assert(this.textures_.length === this.groupIndices_.length,
      'number of textures and groupIndices match');

  this.createTextures_(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);
  goog.DEBUG && console.assert(this.hitDetectionTextures_.length ===
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
  goog.DEBUG && console.assert(textures.length === 0,
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
ol.render.webgl.ImageReplay.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  var gl = context.getGL();

  // bind the vertices buffer
  goog.DEBUG && console.assert(this.verticesBuffer_,
      'verticesBuffer must not be null');
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer_);

  // bind the indices buffer
  goog.DEBUG && console.assert(this.indicesBuffer_,
      'indecesBuffer must not be null');
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

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
ol.render.webgl.ImageReplay.prototype.drawReplay_ = function(gl, context, skippedFeaturesHash, textures, groupIndices) {
  goog.DEBUG && console.assert(textures.length === groupIndices.length,
      'number of textures and groupIndeces match');
  var elementType = context.hasOESElementIndexUint ?
      ol.webgl.UNSIGNED_INT : ol.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  if (!ol.obj.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(
        gl, skippedFeaturesHash, textures, groupIndices,
        elementType, elementSize);
  } else {
    var i, ii, start;
    for (i = 0, ii = textures.length, start = 0; i < ii; ++i) {
      gl.bindTexture(ol.webgl.TEXTURE_2D, textures[i]);
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
ol.render.webgl.ImageReplay.prototype.drawReplaySkipping_ = function(gl, skippedFeaturesHash, textures, groupIndices,
    elementType, elementSize) {
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
  gl.drawElements(ol.webgl.TRIANGLES, numItems, elementType, offsetInBytes);
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
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayOneByOne_ = function(gl, context, skippedFeaturesHash, featureCallback,
    opt_hitExtent) {
  goog.DEBUG && console.assert(this.hitDetectionTextures_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionTextures and hitDetectionGroupIndices match');
  var elementType = context.hasOESElementIndexUint ?
      ol.webgl.UNSIGNED_INT : ol.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

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
  goog.DEBUG && console.assert(anchor, 'imageStyle anchor is not null');
  goog.DEBUG && console.assert(image, 'imageStyle image is not null');
  goog.DEBUG && console.assert(imageSize,
      'imageStyle imageSize is not null');
  goog.DEBUG && console.assert(hitDetectionImage,
      'imageStyle hitDetectionImage is not null');
  goog.DEBUG && console.assert(hitDetectionImageSize,
      'imageStyle hitDetectionImageSize is not null');
  goog.DEBUG && console.assert(opacity !== undefined, 'imageStyle opacity is defined');
  goog.DEBUG && console.assert(origin, 'imageStyle origin is not null');
  goog.DEBUG && console.assert(rotateWithView !== undefined,
      'imageStyle rotateWithView is defined');
  goog.DEBUG && console.assert(rotation !== undefined, 'imageStyle rotation is defined');
  goog.DEBUG && console.assert(size, 'imageStyle size is not null');
  goog.DEBUG && console.assert(scale !== undefined, 'imageStyle scale is defined');

  var currentImage;
  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    currentImage = this.images_[this.images_.length - 1];
    if (ol.getUid(currentImage) != ol.getUid(image)) {
      this.groupIndices_.push(this.indices_.length);
      goog.DEBUG && console.assert(this.groupIndices_.length === this.images_.length,
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
      goog.DEBUG && console.assert(this.hitDetectionGroupIndices_.length ===
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
   * @type {Object.<ol.render.ReplayType, ol.render.webgl.ImageReplay>}
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
