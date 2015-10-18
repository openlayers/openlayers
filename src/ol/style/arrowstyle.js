goog.provide('ol.style.Arrow');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('ol');
goog.require('ol.color');
goog.require('ol.has');
goog.require('ol.render.canvas');
goog.require('ol.structs.IHasChecksum');
goog.require('ol.style.AtlasManager');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');
goog.require('ol.style.Stroke');



/**
 * @classdesc
 * Set arrow style for vector features.
 *
 * @constructor
 * @param {olx.style.ArrowOptions} options Options.
 * @extends {ol.style.Image}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.Arrow = function(options) {

  goog.asserts.assert(options.radius !== undefined,
      'must provide "radius"');

  /**
   * @private
   * @type {Array.<string>}
   */
  this.checksums_ = null;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.hitDetectionCanvas_ = null;

  /**
   * @private
   * @type {ol.style.Fill}
   */
  this.fill_ = options.fill !== undefined ? options.fill : null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.origin_ = [0, 0];

  /**
   * @private
   * @type {number}
   */
  this.radius_ = /** @type {number} */ (options.radius !== undefined ?
      options.radius : options.radius1);

  /**
   * @private
   * @type {number}
   */
  this.frontAngle_ = options.frontAngle !== undefined ?
      options.frontAngle : Math.PI / 5;

  /**
   * @private
   * @type {number}
   */
  this.backAngle_ = options.backAngle !== undefined ?
      options.backAngle : 4 * Math.PI / 5;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = options.stroke !== undefined ? options.stroke : null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.hitDetectionImageSize_ = null;

  this.render_(options.atlasManager);

  /**
   * @type {boolean}
   */
  var snapToPixel = options.snapToPixel !== undefined ?
      options.snapToPixel : true;

  goog.base(this, {
    opacity: 1,
    rotateWithView: false,
    rotation: options.rotation !== undefined ? options.rotation : 0,
    scale: 1,
    snapToPixel: snapToPixel
  });

};
goog.inherits(ol.style.Arrow, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.Arrow.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * Get front angle of the arrow.
 * @return {number} Angle in radians.
 * @api
 */
ol.style.Arrow.prototype.getFrontAngle = function() {
  return this.frontAngle_;
};


/**
 * Get back angle of the arrow.
 * @return {number} Angle in radians.
 * @api
 */
ol.style.Arrow.prototype.getBackAngle = function() {
  return this.backAngle_;
};


/**
 * Get the fill style for the arrow.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Arrow.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Arrow.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.getImageSize = function() {
  return this.imageSize_;
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.getHitDetectionImageSize = function() {
  return this.hitDetectionImageSize_;
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Arrow.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * Get the (primary) radius for the arrow.
 * @return {number} Radius.
 * @api
 */
ol.style.Arrow.prototype.getRadius = function() {
  return this.radius_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Arrow.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke style for the arrow.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Arrow.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.listenImageChange = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.load = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.unlistenImageChange = ol.nullFunction;


/**
 * @typedef {{
 *   strokeStyle: (string|undefined),
 *   strokeWidth: number,
 *   size: number,
 *   lineCap: string,
 *   lineDash: Array.<number>,
 *   lineJoin: string,
 *   miterLimit: number
 * }}
 */
ol.style.Arrow.RenderOptions;


/**
 * @private
 * @param {ol.style.AtlasManager|undefined} atlasManager
 */
ol.style.Arrow.prototype.render_ = function(atlasManager) {
  var imageSize;
  var lineCap = '';
  var lineJoin = '';
  var miterLimit = 0;
  var lineDash = null;
  var strokeStyle;
  var strokeWidth = 0;

  if (this.stroke_) {
    strokeStyle = ol.color.asString(this.stroke_.getColor());
    strokeWidth = this.stroke_.getWidth();
    if (strokeWidth === undefined) {
      strokeWidth = ol.render.canvas.defaultLineWidth;
    }
    lineDash = this.stroke_.getLineDash();
    if (!ol.has.CANVAS_LINE_DASH) {
      lineDash = null;
    }
    lineJoin = this.stroke_.getLineJoin();
    if (lineJoin === undefined) {
      lineJoin = ol.render.canvas.defaultLineJoin;
    }
    lineCap = this.stroke_.getLineCap();
    if (lineCap === undefined) {
      lineCap = ol.render.canvas.defaultLineCap;
    }
    miterLimit = this.stroke_.getMiterLimit();
    if (miterLimit === undefined) {
      miterLimit = ol.render.canvas.defaultMiterLimit;
    }
  }

  var size = 2 * (this.radius_ + strokeWidth) + 1;

  /** @type {ol.style.Arrow.RenderOptions} */
  var renderOptions = {
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    size: size,
    lineCap: lineCap,
    lineDash: lineDash,
    lineJoin: lineJoin,
    miterLimit: miterLimit
  };

  if (atlasManager === undefined) {
    // no atlas manager is used, create a new canvas
    this.canvas_ = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement('CANVAS'));

    this.canvas_.height = size;
    this.canvas_.width = size;

    // canvas.width and height are rounded to the closest integer
    size = this.canvas_.width;
    imageSize = size;

    var context = /** @type {CanvasRenderingContext2D} */
        (this.canvas_.getContext('2d'));
    this.draw_(renderOptions, context, 0, 0);

    this.createHitDetectionCanvas_(renderOptions);
  } else {
    // an atlas manager is used, add the symbol to an atlas
    size = Math.round(size);

    var hasCustomHitDetectionImage = !this.fill_;
    var renderHitDetectionCallback;
    if (hasCustomHitDetectionImage) {
      // render the hit-detection image into a separate atlas image
      renderHitDetectionCallback =
          goog.bind(this.drawHitDetectionCanvas_, this, renderOptions);
    }

    var id = this.getChecksum();
    var info = atlasManager.add(
        id, size, size, goog.bind(this.draw_, this, renderOptions),
        renderHitDetectionCallback);
    goog.asserts.assert(info, 'arrow size is too large');

    this.canvas_ = info.image;
    this.origin_ = [info.offsetX, info.offsetY];
    imageSize = info.image.width;

    if (hasCustomHitDetectionImage) {
      this.hitDetectionCanvas_ = info.hitImage;
      this.hitDetectionImageSize_ =
          [info.hitImage.width, info.hitImage.height];
    } else {
      this.hitDetectionCanvas_ = this.canvas_;
      this.hitDetectionImageSize_ = [imageSize, imageSize];
    }
  }

  this.anchor_ = [size / 2, size / 2];
  this.size_ = [size, size];
  this.imageSize_ = [imageSize, imageSize];
};


/**
 * @private
 * @param {ol.style.Arrow.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.Arrow.prototype.draw_ = function(renderOptions, context, x, y) {
  var innerRadius = this.radius_ / Math.sin(Math.PI - this.backAngle_ / 2) *
      Math.sin(this.backAngle_ / 2 - this.frontAngle_);

  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);


  context.beginPath();

  function lineTo(radius, angle) {
    context.lineTo(
        renderOptions.size / 2 + radius * Math.cos(angle + Math.PI / 2),
        renderOptions.size / 2 - radius * Math.sin(angle + Math.PI / 2));
  }

  lineTo(this.radius_, 0);
  lineTo(this.radius_, Math.PI - this.frontAngle_);
  lineTo(innerRadius, Math.PI);
  lineTo(this.radius_, this.frontAngle_ - Math.PI);
  lineTo(this.radius_, 0);

  if (this.fill_) {
    context.fillStyle = ol.color.asString(this.fill_.getColor());
    context.fill();
  }
  if (this.stroke_) {
    context.strokeStyle = renderOptions.strokeStyle;
    context.lineWidth = renderOptions.strokeWidth;
    if (renderOptions.lineDash) {
      context.setLineDash(renderOptions.lineDash);
    }
    context.lineCap = renderOptions.lineCap;
    context.lineJoin = renderOptions.lineJoin;
    context.miterLimit = renderOptions.miterLimit;
    context.stroke();
  }
  context.closePath();
};


/**
 * @private
 * @param {ol.style.Arrow.RenderOptions} renderOptions
 */
ol.style.Arrow.prototype.createHitDetectionCanvas_ =
    function(renderOptions) {
  this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size];
  if (this.fill_) {
    this.hitDetectionCanvas_ = this.canvas_;
    return;
  }

  // if no fill style is set, create an extra hit-detection image with a
  // default fill style
  this.hitDetectionCanvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement('CANVAS'));
  var canvas = this.hitDetectionCanvas_;

  canvas.height = renderOptions.size;
  canvas.width = renderOptions.size;

  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  this.drawHitDetectionCanvas_(renderOptions, context, 0, 0);
};


/**
 * @private
 * @param {ol.style.Arrow.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.Arrow.prototype.drawHitDetectionCanvas_ =
    function(renderOptions, context, x, y) {
  var innerRadius = this.radius_ / Math.sin(Math.PI - this.backAngle_ / 2) *
      Math.sin(this.backAngle_ / 2 - this.frontAngle_);

  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();

  function lineTo(radius, angle) {
    context.lineTo(
        renderOptions.size / 2 + radius * Math.cos(angle + Math.PI / 2),
        renderOptions.size / 2 - radius * Math.sin(angle + Math.PI / 2));
  }

  lineTo(this.radius_, 0);
  lineTo(this.radius_, Math.PI - this.frontAngle_);
  lineTo(innerRadius / 2, Math.PI);
  lineTo(this.radius_, this.frontAngle_ - Math.PI);
  lineTo(this.radius_, 0);

  context.fillStyle = ol.render.canvas.defaultFillStyle;
  context.fill();
  if (this.stroke_) {
    context.strokeStyle = renderOptions.strokeStyle;
    context.lineWidth = renderOptions.strokeWidth;
    if (renderOptions.lineDash) {
      context.setLineDash(renderOptions.lineDash);
    }
    context.stroke();
  }
  context.closePath();
};


/**
 * @inheritDoc
 */
ol.style.Arrow.prototype.getChecksum = function() {
  var strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
  var fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

  var recalculate = !this.checksums_ ||
      (strokeChecksum != this.checksums_[1] ||
      fillChecksum != this.checksums_[2] ||
      this.radius_ != this.checksums_[3] ||
      this.frontAngle_ != this.checksums_[4] ||
      this.backAngle_ != this.checksums_[5]);

  if (recalculate) {
    var checksum = 'r' + strokeChecksum + fillChecksum +
        (this.radius_ !== undefined ? this.radius_.toString() : '-') +
        (this.frontAngle_ !== undefined ? this.frontAngle_.toString() : '-') +
        (this.backAngle_ !== undefined ? this.backAngle_.toString() : '-');
    this.checksums_ = [checksum, strokeChecksum, fillChecksum,
      this.radius_, this.frontAngle_, this.backAngle_];
  }

  return this.checksums_[0];
};
