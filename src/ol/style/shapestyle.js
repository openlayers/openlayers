goog.provide('ol.style.Shape');
goog.provide('ol.style.ShapeType');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.string');
goog.require('ol.color');
goog.require('ol.render.canvas');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');



/**
 * @constructor
 * @param {olx.style.ShapeOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @todo stability experimental
 */
ol.style.Shape = function(opt_options) {

  /**
   * @const
   * @enum {string}
   */
  this.Paths = {
    SQUARE: 'square',
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    STAR: 'star',
    CROSS: 'cross',
    SVG: 'svg'
  };

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = goog.isDef(options.anchor) ? options.anchor : null;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {number}
   */
  this.canvasScale_ = goog.isDef(options.scale) && !isNaN(options.scale) ?
      options.scale : 1;

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
   * @private
   * @type {number}
   */
  this.margin_ = 0;

  /**
   * @private
   * @type {string}
   */
  this.path_ = (goog.isDef(options.path) ? options.path : this.Paths.CIRCLE);

  /**
   * @private
   * @type {boolean}
   */
  var rotateWithView = goog.isDef(options.rotateWithView) ?
      options.rotateWithView : false;

  /**
   * @private
   * @type {number}
   */
  var rotation = goog.isDef(options.rotation) && !isNaN(options.rotation) ?
      options.rotation : 0;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;

  /**
   * @private
   * @type {string}
   */
  this.svgPath_;

  if (goog.isDef(this.Paths[this.path_.toUpperCase()])) {
    this.path_ = this.path_.toLowerCase();
  } else {
    this.svgPath_ = this.path_;
    this.path_ = this.Paths.SVG;
  }

  goog.base(this, {
    opacity: 1,
    rotateWithView: rotateWithView,
    rotation: rotation,
    scale: 1,
    snapToPixel: undefined
  });
};
goog.inherits(ol.style.Shape, ol.style.Image);


/**
 * @inheritDoc
 */
ol.style.Shape.prototype.getAnchor = function() {
  var size = this.getSize();
  var anchor;
  if (goog.isNull(this.anchor_)) {
    anchor = [size[0] / 2, size[1] / 2];
  } else {
    anchor = [];
    if (goog.isNull(this.anchor_[0]) || isNaN(this.anchor_[0])) {
      anchor[0] = size[0] / 2;
    } else {
      anchor[0] = this.margin_ + this.anchor_[0];
    }
    if (goog.isNull(this.anchor_[1]) || isNaN(this.anchor_[1])) {
      anchor[1] = size[1] / 2;
    } else {
      anchor[1] = this.margin_ + this.anchor_[1];
    }
  }
  return anchor;
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
  if (goog.isNull(this.canvas_)) {
    this.margin_ = this.renderCanvas_();
  }
  return [this.canvas_.width, this.canvas_.height];
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
 * @return {number} Margin.
 */
ol.style.Shape.prototype.renderCanvas_ = function() {
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
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

  var margin = strokeWidth * 2;
  var size;

  switch (this.path_) {
    case this.Paths.SVG:
      size = this.getSVGPathSize_(this.svgPath_);
      size = [size[0] * this.canvasScale_ + margin * 2,
        size[1] * this.canvasScale_ + margin * 2];
      break;
    default:
      size = [this.canvasScale_ + margin * 2, this.canvasScale_ + margin * 2];
      break;
  }

  this.canvas_.width = size[0];
  this.canvas_.height = size[1];

  var context = /** @type {CanvasRenderingContext2D} */
      (this.canvas_.getContext('2d'));

  // deal with the hit detection canvas

  var hitContext = null;

  if (!goog.isNull(this.fill_)) {
    this.hitDetectionCanvas_ = this.canvas_;
  } else {
    this.hitDetectionCanvas_ = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));

    this.hitDetectionCanvas_.width = size[0];
    this.hitDetectionCanvas_.height = size[1];

    hitContext = /** @type {CanvasRenderingContext2D} */
        (this.hitDetectionCanvas_.getContext('2d'));

    hitContext.fillStyle = ol.render.canvas.defaultFillStyle;
  }

  // draw shape on the canvas

  context.translate(margin, margin);
  if (!goog.isNull(hitContext)) {
    hitContext.translate(margin, margin);
  }

  switch (this.path_) {
    case this.Paths.SQUARE:
      this.renderSquare_(context, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderSquare_(hitContext, this.canvasScale_);
      }
      break;
    case this.Paths.CIRCLE:
      this.renderCircle_(context, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderCircle_(hitContext, this.canvasScale_);
      }
      break;
    case this.Paths.TRIANGLE:
      this.renderTriangle_(context, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderTriangle_(hitContext, this.canvasScale_);
      }
      break;
    case this.Paths.STAR:
      this.renderStar_(context, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderStar_(hitContext, this.canvasScale_);
      }
      break;
    case this.Paths.CROSS:
      this.renderCross_(context, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderCross_(hitContext, this.canvasScale_);
      }
      break;
    case this.Paths.SVG:
      this.renderSVG_(context, this.svgPath_, this.canvasScale_);
      if (!goog.isNull(hitContext)) {
        this.renderSVG_(hitContext, this.svgPath_, this.canvasScale_);
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

  return margin;
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} size Shape size.
 */
ol.style.Shape.prototype.renderSquare_ =
    function(context, size) {
  context.rect(0, 0, size, size);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} size Shape size.
 */
ol.style.Shape.prototype.renderCircle_ =
    function(context, size) {
  var radius = size / 2;
  context.arc(radius, radius, radius, 0, 2 * Math.PI, true);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} size Shape size.
 */
ol.style.Shape.prototype.renderTriangle_ =
    function(context, size) {
  context.beginPath();
  context.moveTo(size / 2, 0);
  context.lineTo(0, size);
  context.lineTo(size, size);
  context.closePath();
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {number} size Shape size.
 */
ol.style.Shape.prototype.renderStar_ =
    function(context, size) {
  var outerRadius = size / 2;
  var innerRadius = outerRadius * 0.4;
  var numPoints = 5;
  context.save();
  context.translate(size / 2, size / 2);
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
 * @param {number} size Shape size.
 */
ol.style.Shape.prototype.renderCross_ =
    function(context, size) {
  context.moveTo(size / 2, 0);
  context.lineTo(size / 2, size);
  context.moveTo(0, size / 2);
  context.lineTo(size, size / 2);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {string} svgPath SVG path.
 * @param {number} scale Shape scale.
 */
ol.style.Shape.prototype.renderSVG_ =
    function(context, svgPath, scale) {
  if (!goog.string.isEmptySafe(svgPath)) {
    var path = /** @type {SVGPathElement} */
        (document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    path.setAttributeNS('', 'd', svgPath);
    var segments = path.pathSegList;
    if (goog.isDef(segments)) {
      context.beginPath();
      for (var i = 0, l = segments.numberOfItems; i < l; ++i) {
        var pathSeg = segments.getItem(i);
        switch (pathSeg.pathSegType) {
          case SVGPathSeg.PATHSEG_MOVETO_ABS:
            context.moveTo(pathSeg.x * scale, pathSeg.y * scale);
            break;
          case SVGPathSeg.PATHSEG_LINETO_ABS:
            context.lineTo(pathSeg.x * scale, pathSeg.y * scale);
            break;
          case SVGPathSeg.PATHSEG_CLOSEPATH:
            context.closePath();
            break;
        }
      }
    }
  }
};


/**
 * @private
 * @param {string} svgPath SVG path.
 * @return {Array.<number>} Size.
 */
ol.style.Shape.prototype.getSVGPathSize_ = function(svgPath) {
  var size = [];
  if (!goog.string.isEmptySafe(svgPath)) {
    var path = /** @type {SVGPathElement} */
        (document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    path.setAttributeNS('', 'd', svgPath);
    var segments = path.pathSegList;
    if (goog.isDef(segments)) {
      var width = 0, height = 0;
      for (var i = 0, l = segments.numberOfItems; i < l; ++i) {
        var pathSeg = segments.getItem(i);
        if (pathSeg.x > width) {
          width = pathSeg.x;
        }
        if (pathSeg.y > height) {
          height = pathSeg.y;
        }
      }
      size = [width, height];
    }
  }
  return size;
};
