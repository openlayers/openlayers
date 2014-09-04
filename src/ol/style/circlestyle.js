goog.provide('ol.style.Circle');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.color');
goog.require('ol.render.canvas');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');



/**
 * @classdesc
 * Set circle style for vector features.
 *
 * @constructor
 * @param {olx.style.CircleOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
ol.style.Circle = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.hitDetectionCanvas_ = null;

  /**
   * @private
   * @type {ol.style.Fill}
   */
  this.fill_ = goog.isDef(options.fill) ? options.fill : null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.origin_ = [0, 0];

  /**
   * @private
   * @type {number}
   */
  this.radius_ = options.radius;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;

  var size = this.render_();

  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = [size / 2, size / 2];

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = [size, size];

  /**
   * @type {boolean}
   */
  var snapToPixel = goog.isDef(options.snapToPixel) ?
      options.snapToPixel : true;

  goog.base(this, {
    opacity: 1,
    rotateWithView: false,
    rotation: 0,
    scale: 1,
    snapToPixel: snapToPixel
  });

};
goog.inherits(ol.style.Circle, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.Circle.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Circle.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Circle.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Circle.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * @return {number} Radius.
 * @api
 */
ol.style.Circle.prototype.getRadius = function() {
  return this.radius_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Circle.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Circle.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.listenImageChange = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.load = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.unlistenImageChange = goog.nullFunction;


/**
 * @private
 * @return {number} Size.
 */
ol.style.Circle.prototype.render_ = function() {
  var canvas = this.canvas_;
  var strokeStyle, strokeWidth;

  if (goog.isNull(this.stroke_)) {
    strokeWidth = 0;
  } else {
    strokeStyle = ol.color.asString(this.stroke_.getColor());
    strokeWidth = this.stroke_.getWidth();
    if (!goog.isDef(strokeWidth)) {
      strokeWidth = ol.render.canvas.defaultLineWidth;
    }
  }

  var size = 2 * (this.radius_ + strokeWidth) + 1;

  // draw the circle on the canvas

  canvas.height = size;
  canvas.width = size;

  // canvas.width and height are rounded to the closest integer
  size = canvas.width;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  context.arc(size / 2, size / 2, this.radius_, 0, 2 * Math.PI, true);

  if (!goog.isNull(this.fill_)) {
    context.fillStyle = ol.color.asString(this.fill_.getColor());
    context.fill();
  }
  if (!goog.isNull(this.stroke_)) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = strokeWidth;
    context.stroke();
  }

  // deal with the hit detection canvas

  if (!goog.isNull(this.fill_)) {
    this.hitDetectionCanvas_ = canvas;
  } else {
    this.hitDetectionCanvas_ = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
    canvas = this.hitDetectionCanvas_;

    canvas.height = size;
    canvas.width = size;

    context = /** @type {CanvasRenderingContext2D} */
        (canvas.getContext('2d'));
    context.arc(size / 2, size / 2, this.radius_, 0, 2 * Math.PI, true);

    context.fillStyle = ol.render.canvas.defaultFillStyle;
    context.fill();
    if (!goog.isNull(this.stroke_)) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }

  return size;
};
