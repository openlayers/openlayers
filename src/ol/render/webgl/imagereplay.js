import _ol_ from '../../index';
import _ol_render_webgl_TextureReplay_ from '../webgl/texturereplay';
import _ol_webgl_Buffer_ from '../../webgl/buffer';

/**
 * @constructor
 * @extends {ol.render.webgl.TextureReplay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
var _ol_render_webgl_ImageReplay_ = function(tolerance, maxExtent) {
  _ol_render_webgl_TextureReplay_.call(this, tolerance, maxExtent);

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

_ol_.inherits(_ol_render_webgl_ImageReplay_, _ol_render_webgl_TextureReplay_);


/**
 * @inheritDoc
 */
_ol_render_webgl_ImageReplay_.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  this.drawCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ImageReplay_.prototype.drawPoint = function(pointGeometry, feature) {
  this.startIndices.push(this.indices.length);
  this.startIndicesFeature.push(feature);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  this.drawCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ImageReplay_.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices.push(this.indices.length);
  this.hitDetectionGroupIndices.push(this.indices.length);

  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new _ol_webgl_Buffer_(this.vertices);

  var indices = this.indices;

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new _ol_webgl_Buffer_(indices);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures(this.textures_, this.images_, texturePerImage, gl);

  this.createTextures(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);

  this.images_ = null;
  this.hitDetectionImages_ = null;
  _ol_render_webgl_TextureReplay_.prototype.finish.call(this, context);
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ImageReplay_.prototype.setImageStyle = function(imageStyle) {
  var anchor = imageStyle.getAnchor();
  var image = imageStyle.getImage(1);
  var imageSize = imageStyle.getImageSize();
  var hitDetectionImage = imageStyle.getHitDetectionImage(1);
  var opacity = imageStyle.getOpacity();
  var origin = imageStyle.getOrigin();
  var rotateWithView = imageStyle.getRotateWithView();
  var rotation = imageStyle.getRotation();
  var size = imageStyle.getSize();
  var scale = imageStyle.getScale();

  var currentImage;
  if (this.images_.length === 0) {
    this.images_.push(image);
  } else {
    currentImage = this.images_[this.images_.length - 1];
    if (_ol_.getUid(currentImage) != _ol_.getUid(image)) {
      this.groupIndices.push(this.indices.length);
      this.images_.push(image);
    }
  }

  if (this.hitDetectionImages_.length === 0) {
    this.hitDetectionImages_.push(hitDetectionImage);
  } else {
    currentImage =
        this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
    if (_ol_.getUid(currentImage) != _ol_.getUid(hitDetectionImage)) {
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
_ol_render_webgl_ImageReplay_.prototype.getTextures = function(opt_all) {
  return opt_all ? this.textures_.concat(this.hitDetectionTextures_) : this.textures_;
};


/**
 * @inheritDoc
 */
_ol_render_webgl_ImageReplay_.prototype.getHitDetectionTextures = function() {
  return this.hitDetectionTextures_;
};
export default _ol_render_webgl_ImageReplay_;
