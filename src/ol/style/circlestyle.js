goog.provide('ol.style.Circle');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('ol');
goog.require('ol.color');
goog.require('ol.has');
goog.require('ol.render.canvas');
goog.require('ol.structs.IHasChecksum');
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
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.Circle = function(opt_options) {

  var options = opt_options || {};

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
   * @type {ol.style.Stroke}
   */
  this.stroke_ = options.stroke !== undefined ? options.stroke : null;

  /**
   * @private
   * @type {number}
   */
  this.radius_ = options.radius;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.origin_ = [0, 0];

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
    rotation: 0,
    scale: 1,
    snapToPixel: snapToPixel
  });

};
goog.inherits(ol.style.Circle, ol.style.Image);


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * Get the fill style for the circle.
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
 * Get the image used to render the circle.
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement} Canvas element.
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
 */
ol.style.Circle.prototype.getImageSize = function() {
  return this.imageSize_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getHitDetectionImageSize = function() {
  return this.hitDetectionImageSize_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * Get the circle radius.
 * @return {number} Radius.
 * @api
 */
ol.style.Circle.prototype.getRadius = function() {
  return this.radius_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke style for the circle.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Circle.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.listenImageChange = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.load = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.Circle.prototype.unlistenImageChange = ol.nullFunction;


/**
 * @typedef {{strokeStyle: (string|undefined), strokeWidth: number,
 *   size: number, lineDash: Array.<number>}}
 */
ol.style.Circle.RenderOptions;


/**
 * @private
 * @param {ol.style.AtlasManager|undefined} atlasManager
 */
ol.style.Circle.prototype.render_ = function(atlasManager) {
  var imageSize;
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
  }


  var size = 2 * (this.radius_ + strokeWidth) + 1;

  /** @type {ol.style.Circle.RenderOptions} */
  var renderOptions = {
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    size: size,
    lineDash: lineDash
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

    // draw the circle on the canvas
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
    goog.asserts.assert(info, 'circle radius is too large');

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
 * @param {ol.style.Circle.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.Circle.prototype.draw_ = function(renderOptions, context, x, y) {
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();
  context.arc(
      renderOptions.size / 2, renderOptions.size / 2,
      this.radius_, 0, 2 * Math.PI, true);

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
    context.stroke();
  }
  context.closePath();
};


/**
 * @private
 * @param {ol.style.Circle.RenderOptions} renderOptions
 */
ol.style.Circle.prototype.createHitDetectionCanvas_ = function(renderOptions) {
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
 * @param {ol.style.Circle.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.Circle.prototype.drawHitDetectionCanvas_ =
    function(renderOptions, context, x, y) {
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();
  context.arc(
      renderOptions.size / 2, renderOptions.size / 2,
      this.radius_, 0, 2 * Math.PI, true);

  context.fillStyle = ol.color.asString(ol.render.canvas.defaultFillStyle);
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
ol.style.Circle.prototype.getChecksum = function() {
  var strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
  var fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

  var recalculate = !this.checksums_ ||
      (strokeChecksum != this.checksums_[1] ||
      fillChecksum != this.checksums_[2] ||
      this.radius_ != this.checksums_[3]);

  if (recalculate) {
    var checksum = 'c' + strokeChecksum + fillChecksum +
        (this.radius_ !== undefined ? this.radius_.toString() : '-');
    this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_];
  }

  return this.checksums_[0];
};
