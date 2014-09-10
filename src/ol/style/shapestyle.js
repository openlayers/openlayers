goog.provide('ol.style.Shape');

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
 * Set shape style for vector features.
 *
 * @constructor
 * @param {olx.style.ShapeOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
ol.style.Shape = function(opt_options) {

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
  this.points_ = options.points;

  /**
   * @private
   * @type {number}
   */
  this.radius_ = options.radius;

  /**
   * @private
   * @type {number}
   */
  this.radius2_ =
      goog.isDef(options.radius2) ? options.radius2 : options.radius;

  /**
   * @private
   * @type {number}
   */
  this.angle0_ = goog.isDef(options.angle0) ? options.angle0 : 0;

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
goog.inherits(ol.style.Shape, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Shape.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * @return {number} Radius.
 * @api
 */
ol.style.Shape.prototype.getRadius = function() {
  return this.radius_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Shape.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Shape.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.listenImageChange = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.load = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.unlistenImageChange = goog.nullFunction;


/**
 * @private
 * @return {number} Size.
 */
ol.style.Shape.prototype.render_ = function() {
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

  // draw the shape on the canvas

  canvas.height = size;
  canvas.width = size;

  // canvas.width and height are rounded to the closest integer
  size = canvas.width;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  var i, angle, radiusC;
  context.beginPath();
  if (this.radius2_ !== this.radius_) {
    this.points_ = 2 * this.points_;
  }
  for (i = 0; i <= this.points_; i++) {
    angle = i * 2 * Math.PI / this.points_ - Math.PI / 2 + this.angle0_;
    radiusC = i % 2 === 0 ? this.radius_ : this.radius2_;
    context.lineTo(size / 2 + radiusC * Math.cos(angle),
                   size / 2 + radiusC * Math.sin(angle));
  }

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
    context.beginPath();
    if (this.radius2_ !== this.radius_) {
      this.points_ = 2 * this.points_;
    }
    for (i = 0; i <= this.points_; i++) {
      angle = i * 2 * Math.PI / this.points_ - Math.PI / 2 + this.angle0_;
      radiusC = i % 2 === 0 ? this.radius_ : this.radius2_;
      context.lineTo(size / 2 + radiusC * Math.cos(angle),
                     size / 2 + radiusC * Math.sin(angle));
    }

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
