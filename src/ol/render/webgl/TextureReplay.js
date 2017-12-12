/**
 * @module ol/render/webgl/TextureReplay
 */
import {getUid, inherits} from '../../index.js';
import _ol_extent_ from '../../extent.js';
import _ol_obj_ from '../../obj.js';
import _ol_render_webgl_texturereplay_defaultshader_ from '../webgl/texturereplay/defaultshader.js';
import _ol_render_webgl_texturereplay_defaultshader_Locations_ from '../webgl/texturereplay/defaultshader/Locations.js';
import _ol_render_webgl_Replay_ from '../webgl/Replay.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Context_ from '../../webgl/Context.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
var _ol_render_webgl_TextureReplay_ = function(tolerance, maxExtent) {
  _ol_render_webgl_Replay_.call(this, tolerance, maxExtent);

  /**
   * @type {number|undefined}
   * @protected
   */
  this.anchorX = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.anchorY = undefined;

  /**
   * @type {Array.<number>}
   * @protected
   */
  this.groupIndices = [];

  /**
   * @type {Array.<number>}
   * @protected
   */
  this.hitDetectionGroupIndices = [];

  /**
   * @type {number|undefined}
   * @protected
   */
  this.height = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.imageHeight = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.imageWidth = undefined;

  /**
   * @protected
   * @type {ol.render.webgl.texturereplay.defaultshader.Locations}
   */
  this.defaultLocations = null;

  /**
   * @protected
   * @type {number|undefined}
   */
  this.opacity = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.originX = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.originY = undefined;

  /**
   * @protected
   * @type {boolean|undefined}
   */
  this.rotateWithView = undefined;

  /**
   * @protected
   * @type {number|undefined}
   */
  this.rotation = undefined;

  /**
   * @protected
   * @type {number|undefined}
   */
  this.scale = undefined;

  /**
   * @type {number|undefined}
   * @protected
   */
  this.width = undefined;
};

inherits(_ol_render_webgl_TextureReplay_, _ol_render_webgl_Replay_);


/**
 * @inheritDoc
 */
_ol_render_webgl_TextureReplay_.prototype.getDeleteResourcesFunction = function(context) {
  var verticesBuffer = this.verticesBuffer;
  var indicesBuffer = this.indicesBuffer;
  var textures = this.getTextures(true);
  var gl = context.getGL();
  return function() {
    if (!gl.isContextLost()) {
      var i, ii;
      for (i = 0, ii = textures.length; i < ii; ++i) {
        gl.deleteTexture(textures[i]);
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
 * @protected
 */
_ol_render_webgl_TextureReplay_.prototype.drawCoordinates = function(flatCoordinates, offset, end, stride) {
  var anchorX = /** @type {number} */ (this.anchorX);
  var anchorY = /** @type {number} */ (this.anchorY);
  var height = /** @type {number} */ (this.height);
  var imageHeight = /** @type {number} */ (this.imageHeight);
  var imageWidth = /** @type {number} */ (this.imageWidth);
  var opacity = /** @type {number} */ (this.opacity);
  var originX = /** @type {number} */ (this.originX);
  var originY = /** @type {number} */ (this.originY);
  var rotateWithView = this.rotateWithView ? 1.0 : 0.0;
  // this.rotation_ is anti-clockwise, but rotation is clockwise
  var rotation = /** @type {number} */ (-this.rotation);
  var scale = /** @type {number} */ (this.scale);
  var width = /** @type {number} */ (this.width);
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
 * @protected
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>} images
 *    Images.
 * @param {Object.<string, WebGLTexture>} texturePerImage Texture cache.
 * @param {WebGLRenderingContext} gl Gl.
 */
_ol_render_webgl_TextureReplay_.prototype.createTextures = function(textures, images, texturePerImage, gl) {
  var texture, image, uid, i;
  var ii = images.length;
  for (i = 0; i < ii; ++i) {
    image = images[i];

    uid = getUid(image).toString();
    if (uid in texturePerImage) {
      texture = texturePerImage[uid];
    } else {
      texture = _ol_webgl_Context_.createTexture(
          gl, image, _ol_webgl_.CLAMP_TO_EDGE, _ol_webgl_.CLAMP_TO_EDGE);
      texturePerImage[uid] = texture;
    }
    textures[i] = texture;
  }
};


/**
 * @inheritDoc
 */
_ol_render_webgl_TextureReplay_.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader = _ol_render_webgl_texturereplay_defaultshader_.fragment;
  var vertexShader = _ol_render_webgl_texturereplay_defaultshader_.vertex;
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations) {
    locations = new _ol_render_webgl_texturereplay_defaultshader_Locations_(gl, program);
    this.defaultLocations = locations;
  } else {
    locations = this.defaultLocations;
  }

  // use the program (FIXME: use the return value)
  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, _ol_webgl_.FLOAT,
      false, 32, 0);

  gl.enableVertexAttribArray(locations.a_offsets);
  gl.vertexAttribPointer(locations.a_offsets, 2, _ol_webgl_.FLOAT,
      false, 32, 8);

  gl.enableVertexAttribArray(locations.a_texCoord);
  gl.vertexAttribPointer(locations.a_texCoord, 2, _ol_webgl_.FLOAT,
      false, 32, 16);

  gl.enableVertexAttribArray(locations.a_opacity);
  gl.vertexAttribPointer(locations.a_opacity, 1, _ol_webgl_.FLOAT,
      false, 32, 24);

  gl.enableVertexAttribArray(locations.a_rotateWithView);
  gl.vertexAttribPointer(locations.a_rotateWithView, 1, _ol_webgl_.FLOAT,
      false, 32, 28);

  return locations;
};


/**
 * @inheritDoc
 */
_ol_render_webgl_TextureReplay_.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_offsets);
  gl.disableVertexAttribArray(locations.a_texCoord);
  gl.disableVertexAttribArray(locations.a_opacity);
  gl.disableVertexAttribArray(locations.a_rotateWithView);
};


/**
 * @inheritDoc
 */
_ol_render_webgl_TextureReplay_.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  var textures = hitDetection ? this.getHitDetectionTextures() : this.getTextures();
  var groupIndices = hitDetection ? this.hitDetectionGroupIndices : this.groupIndices;

  if (!_ol_obj_.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping(
        gl, context, skippedFeaturesHash, textures, groupIndices);
  } else {
    var i, ii, start;
    for (i = 0, ii = textures.length, start = 0; i < ii; ++i) {
      gl.bindTexture(_ol_webgl_.TEXTURE_2D, textures[i]);
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
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {Array.<WebGLTexture>} textures Textures.
 * @param {Array.<number>} groupIndices Texture group indices.
 */
_ol_render_webgl_TextureReplay_.prototype.drawReplaySkipping = function(gl, context, skippedFeaturesHash, textures,
    groupIndices) {
  var featureIndex = 0;

  var i, ii;
  for (i = 0, ii = textures.length; i < ii; ++i) {
    gl.bindTexture(_ol_webgl_.TEXTURE_2D, textures[i]);
    var groupStart = (i > 0) ? groupIndices[i - 1] : 0;
    var groupEnd = groupIndices[i];

    var start = groupStart;
    var end = groupStart;
    while (featureIndex < this.startIndices.length &&
        this.startIndices[featureIndex] <= groupEnd) {
      var feature = this.startIndicesFeature[featureIndex];

      var featureUid = getUid(feature).toString();
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
_ol_render_webgl_TextureReplay_.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  var i, groupStart, start, end, feature, featureUid;
  var featureIndex = this.startIndices.length - 1;
  var hitDetectionTextures = this.getHitDetectionTextures();
  for (i = hitDetectionTextures.length - 1; i >= 0; --i) {
    gl.bindTexture(_ol_webgl_.TEXTURE_2D, hitDetectionTextures[i]);
    groupStart = (i > 0) ? this.hitDetectionGroupIndices[i - 1] : 0;
    end = this.hitDetectionGroupIndices[i];

    // draw all features for this texture group
    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      start = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || _ol_extent_.intersects(
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
_ol_render_webgl_TextureReplay_.prototype.finish = function(context) {
  this.anchorX = undefined;
  this.anchorY = undefined;
  this.height = undefined;
  this.imageHeight = undefined;
  this.imageWidth = undefined;
  this.indices = null;
  this.opacity = undefined;
  this.originX = undefined;
  this.originY = undefined;
  this.rotateWithView = undefined;
  this.rotation = undefined;
  this.scale = undefined;
  this.vertices = null;
  this.width = undefined;
};


/**
 * @abstract
 * @protected
 * @param {boolean=} opt_all Return hit detection textures with regular ones.
 * @returns {Array.<WebGLTexture>} Textures.
 */
_ol_render_webgl_TextureReplay_.prototype.getTextures = function(opt_all) {};


/**
 * @abstract
 * @protected
 * @returns {Array.<WebGLTexture>} Textures.
 */
_ol_render_webgl_TextureReplay_.prototype.getHitDetectionTextures = function() {};
export default _ol_render_webgl_TextureReplay_;
