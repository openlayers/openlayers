goog.provide('ol.render.canvas.ImageReplay');

goog.require('ol');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.render.canvas.Replay');


/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
ol.render.canvas.ImageReplay = function(tolerance, maxExtent, resolution, overlaps) {
  ol.render.canvas.Replay.call(this, tolerance, maxExtent, resolution, overlaps);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.hitDetectionImage_ = null;

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorY_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.height_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.opacity_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.originX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
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
   * @private
   * @type {boolean|undefined}
   */
  this.snapToPixel_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = undefined;

};
ol.inherits(ol.render.canvas.ImageReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} My end.
 */
ol.render.canvas.ImageReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {
  return this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false, false);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawPoint = function(pointGeometry, feature) {
  if (!this.image_) {
    return;
  }
  ol.DEBUG && console.assert(this.anchorX_ !== undefined,
      'this.anchorX_ should be defined');
  ol.DEBUG && console.assert(this.anchorY_ !== undefined,
      'this.anchorY_ should be defined');
  ol.DEBUG && console.assert(this.height_ !== undefined,
      'this.height_ should be defined');
  ol.DEBUG && console.assert(this.opacity_ !== undefined,
      'this.opacity_ should be defined');
  ol.DEBUG && console.assert(this.originX_ !== undefined,
      'this.originX_ should be defined');
  ol.DEBUG && console.assert(this.originY_ !== undefined,
      'this.originY_ should be defined');
  ol.DEBUG && console.assert(this.rotateWithView_ !== undefined,
      'this.rotateWithView_ should be defined');
  ol.DEBUG && console.assert(this.rotation_ !== undefined,
      'this.rotation_ should be defined');
  ol.DEBUG && console.assert(this.scale_ !== undefined,
      'this.scale_ should be defined');
  ol.DEBUG && console.assert(this.width_ !== undefined,
      'this.width_ should be defined');
  this.beginGeometry(pointGeometry, feature);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.endGeometry(pointGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawMultiPoint = function(multiPointGeometry, feature) {
  if (!this.image_) {
    return;
  }
  ol.DEBUG && console.assert(this.anchorX_ !== undefined,
      'this.anchorX_ should be defined');
  ol.DEBUG && console.assert(this.anchorY_ !== undefined,
      'this.anchorY_ should be defined');
  ol.DEBUG && console.assert(this.height_ !== undefined,
      'this.height_ should be defined');
  ol.DEBUG && console.assert(this.opacity_ !== undefined,
      'this.opacity_ should be defined');
  ol.DEBUG && console.assert(this.originX_ !== undefined,
      'this.originX_ should be defined');
  ol.DEBUG && console.assert(this.originY_ !== undefined,
      'this.originY_ should be defined');
  ol.DEBUG && console.assert(this.rotateWithView_ !== undefined,
      'this.rotateWithView_ should be defined');
  ol.DEBUG && console.assert(this.rotation_ !== undefined,
      'this.rotation_ should be defined');
  ol.DEBUG && console.assert(this.scale_ !== undefined,
      'this.scale_ should be defined');
  ol.DEBUG && console.assert(this.width_ !== undefined,
      'this.width_ should be defined');
  this.beginGeometry(multiPointGeometry, feature);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.endGeometry(multiPointGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.finish = function() {
  this.reverseHitDetectionInstructions();
  // FIXME this doesn't really protect us against further calls to draw*Geometry
  this.anchorX_ = undefined;
  this.anchorY_ = undefined;
  this.hitDetectionImage_ = null;
  this.image_ = null;
  this.height_ = undefined;
  this.scale_ = undefined;
  this.opacity_ = undefined;
  this.originX_ = undefined;
  this.originY_ = undefined;
  this.rotateWithView_ = undefined;
  this.rotation_ = undefined;
  this.snapToPixel_ = undefined;
  this.width_ = undefined;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  ol.DEBUG && console.assert(imageStyle, 'imageStyle should not be null');
  var anchor = imageStyle.getAnchor();
  ol.DEBUG && console.assert(anchor, 'anchor should not be null');
  var size = imageStyle.getSize();
  ol.DEBUG && console.assert(size, 'size should not be null');
  var hitDetectionImage = imageStyle.getHitDetectionImage(1);
  ol.DEBUG && console.assert(hitDetectionImage,
      'hitDetectionImage should not be null');
  var image = imageStyle.getImage(1);
  ol.DEBUG && console.assert(image, 'image should not be null');
  var origin = imageStyle.getOrigin();
  ol.DEBUG && console.assert(origin, 'origin should not be null');
  this.anchorX_ = anchor[0];
  this.anchorY_ = anchor[1];
  this.hitDetectionImage_ = hitDetectionImage;
  this.image_ = image;
  this.height_ = size[1];
  this.opacity_ = imageStyle.getOpacity();
  this.originX_ = origin[0];
  this.originY_ = origin[1];
  this.rotateWithView_ = imageStyle.getRotateWithView();
  this.rotation_ = imageStyle.getRotation();
  this.scale_ = imageStyle.getScale();
  this.snapToPixel_ = imageStyle.getSnapToPixel();
  this.width_ = size[0];
};
