// FIXME complete missing functionality
// FIXME factor out drawImage
// FIXME apply snapToPixel
// FIXME factor out moveTo/lineTo

goog.provide('ol.render.canvas.Render');

goog.require('goog.asserts');
goog.require('ol.render');
goog.require('ol.render.IRender');
goog.require('ol.style.fill');
goog.require('ol.style.stroke');



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.Render = function(context, transform) {

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = context;

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.transform_ = transform;

  /**
   * @private
   * @type {{fillStyle: ?ol.style.Fill,
   *         imageStyle: ?ol.style.Image,
   *         strokeStyle: ?ol.style.Stroke}}
   */
  this.state_ = {
    fillStyle: null,
    imageStyle: null,
    strokeStyle: null
  };

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawPointGeometry = function(pointGeometry) {
  var context = this.context_;
  var imageStyle = this.state_.imageStyle;
  if (goog.isNull(imageStyle)) {
    return;
  }
  var pixelCoordinates = ol.render.transformGeometry(
      pointGeometry, this.transform_, this.pixelCoordinates_);
  context.drawImage(
      imageStyle.image,
      pixelCoordinates[0] - imageStyle.anchor[0],
      pixelCoordinates[1] - imageStyle.anchor[1]);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
  var context = this.context_;
  var imageStyle = this.state_.imageStyle;
  if (goog.isNull(imageStyle)) {
    return;
  }
  var pixelCoordinates = ol.render.transformGeometry(
      multiPointGeometry, this.transform_, this.pixelCoordinates_);
  var i, ii;
  for (i = 0, ii = pixelCoordinates.length; i < ii; i += 2) {
    context.drawImage(
        imageStyle.image,
        pixelCoordinates[i] - imageStyle.anchor[0],
        pixelCoordinates[i + 1] - imageStyle.anchor[1]);
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  if (goog.isNull(this.state_.strokeStyle)) {
    return;
  }
  var context = this.context_;
  var pixelCoordinates = ol.render.transformGeometry(
      lineStringGeometry, this.transform_, this.pixelCoordinates_);
  context.beginPath();
  context.moveTo(pixelCoordinates[0], pixelCoordinates[1]);
  var i, ii;
  for (i = 2, ii = pixelCoordinates.length; i < ii; ++i) {
    context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
  }
  context.stroke();
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod; // FIXME


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawPolygonGeometry =
    goog.abstractMethod; // FIXME


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod; // FIXME


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  var context = this.context_;
  var state = this.state_;
  if (!ol.style.fill.equals(state.fillStyle, fillStyle)) {
    context.fillStyle = fillStyle.color;
    state.fillStyle = fillStyle;
  }
  if (!ol.style.stroke.equals(state.strokeStyle, strokeStyle)) {
    context.strokeStyle = strokeStyle.color;
    context.lineWidth = strokeStyle.width;
    state.strokeStyle = strokeStyle;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Render.prototype.setImageStyle = function(imageStyle) {
  this.state_.imageStyle = imageStyle;
};
