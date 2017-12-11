goog.provide('ol.render.webgl.ImageReplay');

goog.require('ol');
goog.require('ol.render.webgl.TextureReplay');
goog.require('ol.webgl.Buffer');


/**
 * @constructor
 * @extends {ol.render.webgl.TextureReplay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.ImageReplay = function(tolerance, maxExtent) {
  ol.render.webgl.TextureReplay.call(this, tolerance, maxExtent);

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
ol.inherits(ol.render.webgl.ImageReplay, ol.render.webgl.TextureReplay);


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
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
ol.render.webgl.ImageReplay.prototype.drawPoint = function(pointGeometry, feature) {
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
ol.render.webgl.ImageReplay.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices.push(this.indices.length);
  this.hitDetectionGroupIndices.push(this.indices.length);

  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

  var indices = this.indices;

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new ol.webgl.Buffer(indices);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures(this.textures_, this.images_, texturePerImage, gl);

  this.createTextures(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);

  this.images_ = null;
  this.hitDetectionImages_ = null;
  ol.render.webgl.TextureReplay.prototype.finish.call(this, context);
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.setImageStyle = function(imageStyle) {
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
    if (ol.getUid(currentImage) != ol.getUid(image)) {
      this.groupIndices.push(this.indices.length);
      this.images_.push(image);
    }
  }

  if (this.hitDetectionImages_.length === 0) {
    this.hitDetectionImages_.push(hitDetectionImage);
  } else {
    currentImage =
        this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
    if (ol.getUid(currentImage) != ol.getUid(hitDetectionImage)) {
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
ol.render.webgl.ImageReplay.prototype.getTextures = function(opt_all) {
  return opt_all ? this.textures_.concat(this.hitDetectionTextures_) : this.textures_;
};


/**
 * @inheritDoc
 */
ol.render.webgl.ImageReplay.prototype.getHitDetectionTextures = function() {
  return this.hitDetectionTextures_;
};
