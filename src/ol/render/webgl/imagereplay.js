goog.provide('ol.render.webgl.ImageReplay');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.render.webgl.imagereplay.defaultshader');
goog.require('ol.render.webgl.Replay');
goog.require('ol.render.webgl');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');
goog.require('ol.webgl.Context');


/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
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
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other ImageReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  ol.DEBUG && console.assert(this.verticesBuffer,
      'verticesBuffer must not be null');
  ol.DEBUG && console.assert(this.indicesBuffer,
      'indicesBuffer must not be null');
  var verticesBuffer = this.verticesBuffer;
  var indicesBuffer = this.indicesBuffer;
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
  // this.rotation_ is anti-clockwise, but rotation is clockwise
  var rotation = /** @type {number} */ (-this.rotation_);
  var scale = /** @type {number} */ (this.scale_);
  var width = /** @type {number} */ (this.width_);
  var cos = Math.cos(rotation);
  var sin = Math.sin(rotation);
  var numIndices = this.indices.length;
  var numVertices = this.vertices.length;
  var i, n, offsetX, offsetY, x, y;
  for (i = offset; i < end; i += stride) {
    x = flatCoordinates[i] - this.origin[0];
    y = flatCoordinates[i + 1] - this.origin[1];

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
    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices[numVertices++] = originX / imageWidth;
    this.vertices[numVertices++] = (originY + height) / imageHeight;
    this.vertices[numVertices++] = opacity;
    this.vertices[numVertices++] = rotateWithView;

    // bottom-right corner
    offsetX = scale * (width - anchorX);
    offsetY = -scale * (height - anchorY);
    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices[numVertices++] = (originX + width) / imageWidth;
    this.vertices[numVertices++] = (originY + height) / imageHeight;
    this.vertices[numVertices++] = opacity;
    this.vertices[numVertices++] = rotateWithView;

    // top-right corner
    offsetX = scale * (width - anchorX);
    offsetY = scale * anchorY;
    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices[numVertices++] = (originX + width) / imageWidth;
    this.vertices[numVertices++] = originY / imageHeight;
    this.vertices[numVertices++] = opacity;
    this.vertices[numVertices++] = rotateWithView;

    // top-left corner
    offsetX = -scale * anchorX;
    offsetY = scale * anchorY;
    this.vertices[numVertices++] = x;
    this.vertices[numVertices++] = y;
    this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
    this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
    this.vertices[numVertices++] = originX / imageWidth;
    this.vertices[numVertices++] = originY / imageHeight;
    this.vertices[numVertices++] = opacity;
    this.vertices[numVertices++] = rotateWithView;

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
ol.render.webgl.ImageReplay.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawPoint = function(pointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices_.push(this.indices.length);
  ol.DEBUG && console.assert(this.images_.length === this.groupIndices_.length,
      'number of images and groupIndices match');
  this.hitDetectionGroupIndices_.push(this.indices.length);
  ol.DEBUG && console.assert(this.hitDetectionImages_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionImages and hitDetectionGroupIndices match');

  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

  var indices = this.indices;
  var bits = context.hasOESElementIndexUint ? 32 : 16;
  ol.DEBUG && console.assert(indices[indices.length - 1] < Math.pow(2, bits),
      'Too large element index detected [%s] (OES_element_index_uint "%s")',
      indices[indices.length - 1], context.hasOESElementIndexUint);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new ol.webgl.Buffer(indices);

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
  this.indices = null;
  this.opacity_ = undefined;
  this.originX_ = undefined;
  this.originY_ = undefined;
  this.rotateWithView_ = undefined;
  this.rotation_ = undefined;
  this.scale_ = undefined;
  this.vertices = null;
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
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
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
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_offsets);
  gl.disableVertexAttribArray(locations.a_texCoord);
  gl.disableVertexAttribArray(locations.a_opacity);
  gl.disableVertexAttribArray(locations.a_rotateWithView);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
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
      this.drawElements(gl, context, start, end);
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
    while (featureIndex < this.startIndices.length &&
        this.startIndices[featureIndex] <= groupEnd) {
      var feature = this.startIndicesFeature[featureIndex];

      var featureUid = ol.getUid(feature).toString();
      if (skippedFeaturesHash[featureUid] !== undefined) {
        // feature should be skipped
        if (start !== end) {
          // draw the features so far
          this.drawElements(gl, context, start, end);
        }
        // continue with the next feature
        start = (featureIndex === this.startIndices.length - 1) ?
            groupEnd : this.startIndices[featureIndex + 1];
        end = start;
      } else {
        // the feature is not skipped, augment the end index
        end = (featureIndex === this.startIndices.length - 1) ?
            groupEnd : this.startIndices[featureIndex + 1];
      }
      featureIndex++;
    }

    if (start !== end) {
      // draw the remaining features (in case there was no skipped feature
      // in this texture group, all features of a group are drawn together)
      this.drawElements(gl, context, start, end);
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  ol.DEBUG && console.assert(this.hitDetectionTextures_.length ===
      this.hitDetectionGroupIndices_.length,
      'number of hitDetectionTextures and hitDetectionGroupIndices match');

  var i, groupStart, start, end, feature, featureUid;
  var featureIndex = this.startIndices.length - 1;
  for (i = this.hitDetectionTextures_.length - 1; i >= 0; --i) {
    gl.bindTexture(ol.webgl.TEXTURE_2D, this.hitDetectionTextures_[i]);
    groupStart = (i > 0) ? this.hitDetectionGroupIndices_[i - 1] : 0;
    end = this.hitDetectionGroupIndices_[i];

    // draw all features for this texture group
    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      start = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || ol.extent.intersects(
              /** @type {Array<number>} */ (opt_hitExtent),
              feature.getGeometry().getExtent()))) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements(gl, context, start, end);

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
      this.groupIndices_.push(this.indices.length);
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
      this.hitDetectionGroupIndices_.push(this.indices.length);
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
