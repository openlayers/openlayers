/**
 * @module ol/render/webgl/ImageReplay
 */
import {getUid, inherits} from '../../util.js';
import WebGLTextureReplay from '../webgl/TextureReplay.js';
import WebGLBuffer from '../../webgl/Buffer.js';

/**
 * @constructor
 * @extends {module:ol/render/webgl/TextureReplay}
 * @param {number} tolerance Tolerance.
 * @param {module:ol/extent~Extent} maxExtent Max extent.
 * @struct
 */
const WebGLImageReplay = function(tolerance, maxExtent) {
  WebGLTextureReplay.call(this, tolerance, maxExtent);

  /**
   * @type {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
   * @protected
   */
  this.images_ = [];

  /**
   * @type {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
   * @protected
   */
  this.hitDetectionImages_ = [];

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

};

inherits(WebGLImageReplay, WebGLTextureReplay);


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  const flatCoordinates = multiPointGeometry.getFlatCoordinates();
  const stride = multiPointGeometry.getStride();
  this.drawCoordinates(
    flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.drawPoint = function(pointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  const flatCoordinates = pointGeometry.getFlatCoordinates();
  const stride = pointGeometry.getStride();
  this.drawCoordinates(
    flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.finish = function(context) {
  const gl = context.getGL();

  this.groupIndices.push(this.indices.length);
  this.hitDetectionGroupIndices.push(this.indices.length);

  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new WebGLBuffer(this.vertices);

  const indices = this.indices;

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new WebGLBuffer(indices);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  const texturePerImage = {};

  this.createTextures(this.textures_, this.images_, texturePerImage, gl);

  this.createTextures(this.hitDetectionTextures_, this.hitDetectionImages_,
    texturePerImage, gl);

  this.images_ = null;
  this.hitDetectionImages_ = null;
  WebGLTextureReplay.prototype.finish.call(this, context);
};


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.setImageStyle = function(imageStyle) {
  const anchor = imageStyle.getAnchor();
  const image = imageStyle.getImage(1);
  const imageSize = imageStyle.getImageSize();
  const hitDetectionImage = imageStyle.getHitDetectionImage(1);
  const opacity = imageStyle.getOpacity();
  const origin = imageStyle.getOrigin();
  const rotateWithView = imageStyle.getRotateWithView();
  const rotation = imageStyle.getRotation();
  const size = imageStyle.getSize();
  const scale = imageStyle.getScale();

  let currentImage;
  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    currentImage = this.images_[this.images_.length - 1];
    if (getUid(currentImage) != getUid(image)) {
      this.groupIndices.push(this.indices.length);
      this.images_.push(image);
    }
  }

  if (this.hitDetectionImages_.length === 0) {
    this.hitDetectionImages_.push(hitDetectionImage);
  } else {
    currentImage =
        this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
    if (getUid(currentImage) != getUid(hitDetectionImage)) {
      this.hitDetectionGroupIndices.push(this.indices.length);
      this.hitDetectionImages_.push(hitDetectionImage);
    }
  }

  this.anchorX = anchor[0];
  this.anchorY = anchor[1];
  this.height = size[1];
  this.imageHeight = imageSize[1];
  this.imageWidth = imageSize[0];
  this.opacity = opacity;
  this.originX = origin[0];
  this.originY = origin[1];
  this.rotation = rotation;
  this.rotateWithView = rotateWithView;
  this.scale = scale;
  this.width = size[0];
};


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.getTextures = function(opt_all) {
  return opt_all ? this.textures_.concat(this.hitDetectionTextures_) : this.textures_;
};


/**
 * @inheritDoc
 */
WebGLImageReplay.prototype.getHitDetectionTextures = function() {
  return this.hitDetectionTextures_;
};
export default WebGLImageReplay;
