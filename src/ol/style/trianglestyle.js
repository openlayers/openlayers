goog.provide('ol.style.Triangle');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.color');
goog.require('ol.render.canvas');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');



/**
 * @constructor
 * @param {olx.style.TriangleOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @todo stability experimental
 */
ol.style.Triangle = function(opt_options) {

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
    * @type {ol.Size}
    */
  this.size_ = goog.isDef(options.size) ? options.size : null;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;

  /**
   * @type {number}
   */
  var rotation = goog.isDef(options.rotation) ? options.rotation : 0;

  this.renderedSize_ = this.render_();

  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = [this.renderedSize_[0] / 2, this.renderedSize_[1] / 2];

  goog.base(this, {
    opacity: 1,
    rotation: rotation,
    scale: 1,
    snapToPixel: undefined,
    subtractViewRotation: false
  });

};
goog.inherits(ol.style.Triangle, ol.style.Image);


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * @return {ol.style.Fill} Fill style.
 */
ol.style.Triangle.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.getSize = function() {
  return this.renderedSize_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 */
ol.style.Triangle.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.listenImageChange = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.load = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Triangle.prototype.unlistenImageChange = goog.nullFunction;


/**
 * @private
 * @return {ol.Size} Size.
 */
ol.style.Triangle.prototype.render_ = function() {
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

  var size = [this.size_[0] + strokeWidth * 2, this.size_[1] + strokeWidth * 2];

  // draw the triangle on the canvas

  canvas.width = size[0];
  canvas.height = size[1];

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  context.beginPath();
  context.moveTo(size[0] / 2, strokeWidth);
  context.lineTo(strokeWidth, this.size_[1] + strokeWidth);
  context.lineTo(strokeWidth + this.size_[0], this.size_[1] + strokeWidth);
  context.closePath();

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

    canvas.width = size[0];
    canvas.height = size[1];

    context = /** @type {CanvasRenderingContext2D} */
        (canvas.getContext('2d'));
    context.beginPath();
    context.moveTo(size[0] / 2, strokeWidth);
    context.lineTo(strokeWidth, this.size_[1] + strokeWidth);
    context.lineTo(strokeWidth + this.size_[0], this.size_[1] + strokeWidth);
    context.closePath();

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
