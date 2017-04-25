goog.provide('ol.style.Shape');
goog.provide('ol.style.ShapeType');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.color');
goog.require('ol.render.canvas');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');


/**
 * @enum {number}
 */
ol.style.ShapeType = {
  SQUARE: 0,
  CIRCLE: 1,
  TRIANGLE: 2,
  STAR: 3,
  CROSS: 4,
  X: 5
};


/**
 * @typedef {{type: ol.style.ShapeType,
 *            size: ol.Size,
 *            rotation: number,
 *            fill: ol.style.Fill,
 *            stroke: ol.style.Stroke}}
 */
ol.style.ShapeOptions;



/**
 * @constructor
 * @param {ol.style.ShapeOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @todo stability experimental
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
    * @type {ol.style.Fill}
    */
  this.fill_ = goog.isDef(options.fill) ? options.fill : null;


  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.hitDetectionCanvas_ = null;

  /**
 * @type {boolean}
 */
  var rotateWithView = goog.isDef(options.rotateWithView) ?
      options.rotateWithView : false;

  /**
    * @private
    * @type {ol.Size}
    */
  this.size_ = options.size;


  /**
    * @private
    * @type {ol.style.Stroke}
    */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;


  /**
    * @type {ol.style.ShapeType}
    * @private
    */
  this.type_ = /** @type {ol.style.ShapeType} */ (goog.isDef(options.type) ?
      options.type : ol.style.ShapeType.SQUARE);


  /**
    * @private
    * @type {ol.Size}
    */
  //this.renderedSize_ = this.render_();


  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = [this.size_[0] / 2, this.size_[1] / 2];


  goog.base(this, {
    opacity: 1,
    rotateWithView: rotateWithView,
    rotation: goog.isDef(options.rotation) ? options.rotation : 0,
    scale: 1,
    snapToPixel: undefined
  });

  this.render_();
};
goog.inherits(ol.style.Shape, ol.style.Image);


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * @return {ol.style.Fill} Fill style.
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
 * @return {ol.Size} Size.
 */
ol.style.Shape.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
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

  var width = this.size_[0];
  var height = this.size_[1];

  canvas.width = width;
  canvas.height = height;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));

  // deal with the hit detection canvas

  var hitContext = null;

  if (!goog.isNull(this.fill_)) {
    this.hitDetectionCanvas_ = canvas;
  } else {
    this.hitDetectionCanvas_ = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));

    this.hitDetectionCanvas_.width = width;
    this.hitDetectionCanvas_.height = height;

    hitContext = /** @type {CanvasRenderingContext2D} */
        (this.hitDetectionCanvas_.getContext('2d'));

    hitContext.fillStyle = ol.render.canvas.defaultFillStyle;
  }

  // draw shape on the canvas

  switch (this.type_) {
    case 0:
      this.renderSquare_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderSquare_(hitContext, width, height, strokeWidth);
      }
      break;
    case 1:
      this.renderCircle_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderCircle_(hitContext, width, height, strokeWidth);
      }
      break;
    case 2:
      this.renderTriangle_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderTriangle_(hitContext, width, height, strokeWidth);
      }
      break;
    case 3:
      this.renderStar_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderStar_(hitContext, width, height, strokeWidth);
      }
      break;
    case 4:
      this.renderCross_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderCross_(hitContext, width, height, strokeWidth);
      }
      break;
    case 5:
      this.renderX_(context, width, height, strokeWidth);
      if (hitContext !== null) {
        this.renderX_(hitContext, width, height, strokeWidth);
      }
      break;
  }

  if (!goog.isNull(this.fill_)) {
    context.fillStyle = ol.color.asString(this.fill_.getColor());
    context.fill();
  }
  if (hitContext !== null) {
    hitContext.fill();
  }
  if (!goog.isNull(this.stroke_)) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = strokeWidth;
    context.stroke();
    if (hitContext !== null) {
      hitContext.strokeStyle = strokeStyle;
      hitContext.lineWidth = strokeWidth;
      hitContext.stroke();
    }
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderSquare_ =
    function(context, width, height, strokeWidth) {
  var rectWidth = width - strokeWidth;
  var rectHeight = height - strokeWidth;
  context.rect(strokeWidth / 2, strokeWidth / 2, rectWidth, rectHeight);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderCircle_ =
    function(context, width, height, strokeWidth) {
  var centerX = width / 2;
  var centerY = height / 2;
  var radius1 = (height - strokeWidth) / 2;
  var radius2 = (width - strokeWidth) / 2;
  var sin = Math.sin(0 * Math.PI);
  var cos = Math.cos(0 * Math.PI);
  var xPos, yPos;
  for (var i = 0 * Math.PI; i < 2 * Math.PI; i += 0.01) {
    xPos = centerX - (radius1 * Math.sin(i)) * sin +
        (radius2 * Math.cos(i)) * cos;
    yPos = centerY + (radius2 * Math.cos(i)) * sin +
        (radius1 * Math.sin(i)) * cos;
    if (i == 0) {
      context.moveTo(xPos, yPos);
    } else {
      context.lineTo(xPos, yPos);
    }
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderTriangle_ =
    function(context, width, height, strokeWidth) {
  context.beginPath();
  context.moveTo(width / 2, strokeWidth);
  context.lineTo(strokeWidth, height - strokeWidth);
  context.lineTo(width - strokeWidth, height - strokeWidth);
  context.closePath();
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderStar_ =
    function(context, width, height, strokeWidth) {
  var outerRadius = Math.min(width, height) / 2 - strokeWidth;
  var innerRadius = outerRadius * 0.4;
  var numPoints = 5;
  context.save();
  context.translate(width / 2, height / 2);
  context.beginPath();
  context.moveTo(0, 0 - outerRadius);
  for (var n = 1; n < numPoints * 2; n++) {
    var radius = n % 2 === 0 ? outerRadius : innerRadius;
    var x = radius * Math.sin(n * Math.PI / numPoints);
    var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
    context.lineTo(x, y);
  }
  context.closePath();
  context.restore();
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderCross_ =
    function(context, width, height, strokeWidth) {
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @param {number} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.renderX_ =
    function(context, width, height, strokeWidth) {
  context.moveTo(strokeWidth / 2, strokeWidth / 2);
  context.lineTo(width - strokeWidth / 2, height - strokeWidth / 2);
  context.moveTo(strokeWidth / 2, height - strokeWidth / 2);
  context.lineTo(width - strokeWidth / 2, strokeWidth / 2);
};
