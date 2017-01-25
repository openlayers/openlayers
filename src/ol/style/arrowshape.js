goog.provide('ol.style.ArrowShape');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.dom');
goog.require('ol.has');
goog.require('ol.ImageState');
goog.require('ol.render.canvas');
goog.require('ol.style.Image');


/**
 * @classdesc
 * Set arrow shape style for vector features. The resulting shape will be
 * an arrow with `length` and `width` provided.
 *
 * @constructor
 * @param {olx.style.ArrowShapeOptions} options Options.
 * @extends {ol.style.Image}
 * @api
 */
ol.style.ArrowShape = function(options) {

  goog.asserts.assert(
      options.length !== undefined && options.width !== undefined,
      'must provide either "length" and "width"');

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
  this.width_ = options.width;

  /**
   * @private
   * @type {number}
   */
  this.length_ = options.length;

  /**
   * @private
   * @type {number}
   */
  this.angle_ = options.angle !== undefined ? options.angle : 0;

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

  /**
   * @type {boolean}
   */
  var rotateWithView = options.rotateWithView !== undefined ?
      options.rotateWithView : false;

  ol.style.Image.call(this, {
    opacity: 1,
    rotateWithView: rotateWithView,
    rotation: options.rotation !== undefined ? options.rotation : 0,
    scale: 1,
    snapToPixel: snapToPixel
  });

};
ol.inherits(ol.style.ArrowShape, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.ArrowShape.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * Get the angle used in generating the shape, this is the pointing direction of the arrow.
 * @return {number} Shape's rotation in radians.
 * @api
 */
ol.style.ArrowShape.prototype.getAngle = function() {
  return this.angle_;
};


/**
 * Get the fill style for the shape.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.ArrowShape.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.ArrowShape.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.getImageSize = function() {
  return this.imageSize_;
};


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.getHitDetectionImageSize = function() {
  return this.hitDetectionImageSize_;
};


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.getImageState = function() {
  return ol.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.ArrowShape.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * Get the width of the arrow, aka the extent normal to the pointing direction.
 * @return {number} Width.
 * @api
 */
ol.style.ArrowShape.prototype.getWidth = function() {
  return this.width_;
};


/**
 * Get the length of the arrow, aka the extent in pointing direction.
 * @return {number} Length.
 * @api
 */
ol.style.ArrowShape.prototype.getLength = function() {
  return this.length_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.ArrowShape.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke style for the shape.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.ArrowShape.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.listenImageChange = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.load = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.ArrowShape.prototype.unlistenImageChange = ol.nullFunction;


/**
 * @private
 * @param {ol.style.AtlasManager|undefined} atlasManager An atlas manager.
 */
ol.style.ArrowShape.prototype.render_ = function(atlasManager) {
  var imageSize;
  var lineCap = '';
  var lineJoin = '';
  var miterLimit = 0;
  var lineDash = null;
  var strokeStyle;
  var strokeWidth = 0;

  if (this.stroke_) {
    strokeStyle = ol.colorlike.asColorLike(this.stroke_.getColor());
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

  var size = 2 * (Math.sqrt(this.width_ * this.width_ + this.length_ * this.length_) + strokeWidth) + 1;

  /** @type {ol.ArrowShapeRenderOptions} */
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
    var context = ol.dom.createCanvasContext2D(size, size);
    this.canvas_ = context.canvas;

    // canvas.width and height are rounded to the closest integer
    size = this.canvas_.width;
    imageSize = size;

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
          this.drawHitDetectionCanvas_.bind(this, renderOptions);
    }

    var id = this.getChecksum();
    var info = atlasManager.add(
        id, size, size, this.draw_.bind(this, renderOptions),
        renderHitDetectionCallback);
    goog.asserts.assert(info, 'shape size is too large');

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
 * @param {ol.ArrowShapeRenderOptions} renderOptions Render options.
 * @param {CanvasRenderingContext2D} context The rendering context.
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.ArrowShape.prototype.draw_ = function(renderOptions, context, x, y) {
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();

  var ca =  Math.cos(this.angle_);
  var sa =  Math.sin(this.angle_);

  context.moveTo(renderOptions.size / 2 - ca * this.length_ - sa * this.width_,
                 renderOptions.size / 2 - sa * this.length_ + ca * this.width_);
  context.lineTo(renderOptions.size / 2,renderOptions.size / 2);
  context.lineTo(renderOptions.size / 2 - ca * this.length_ + sa * this.width_,
                 renderOptions.size / 2 - sa * this.length_ - ca * this.width_);

  if (this.fill_) {
    context.fillStyle = ol.colorlike.asColorLike(this.fill_.getColor());
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
 * @param {ol.ArrowShapeRenderOptions} renderOptions Render options.
 */
ol.style.ArrowShape.prototype.createHitDetectionCanvas_ = function(renderOptions) {
  this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size];
  if (this.fill_) {
    this.hitDetectionCanvas_ = this.canvas_;
    return;
  }

  // if no fill style is set, create an extra hit-detection image with a
  // default fill style
  var context = ol.dom.createCanvasContext2D(renderOptions.size, renderOptions.size);
  this.hitDetectionCanvas_ = context.canvas;

  this.drawHitDetectionCanvas_(renderOptions, context, 0, 0);
};


/**
 * @private
 * @param {ol.ArrowShapeRenderOptions} renderOptions Render options.
 * @param {CanvasRenderingContext2D} context The context.
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.ArrowShape.prototype.drawHitDetectionCanvas_ = function(renderOptions, context, x, y) {
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();

  var ca =  Math.cos(this.angle_);
  var sa =  Math.sin(this.angle_);

  context.moveTo(renderOptions.size / 2 - ca * this.length_ - sa * this.width_,
                 renderOptions.size / 2 - sa * this.length_ + ca * this.width_);
  context.lineTo(renderOptions.size / 2,renderOptions.size / 2);
  context.lineTo(renderOptions.size / 2 - ca * this.length_ + sa * this.width_,
                 renderOptions.size / 2 - sa * this.length_ - ca * this.width_);

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
 * @return {string} The checksum.
 */
ol.style.ArrowShape.prototype.getChecksum = function() {
  var strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
  var fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

  var recalculate = !this.checksums_ ||
      (strokeChecksum != this.checksums_[1] ||
      fillChecksum != this.checksums_[2] ||
      this.width_ != this.checksums_[3] ||
      this.length_ != this.checksums_[4] ||
      this.angle_ != this.checksums_[5]);

  if (recalculate) {
    var checksum = 'r' + strokeChecksum + fillChecksum +
        (this.width_ !== undefined ? this.width_.toString() : '-') +
        (this.length_ !== undefined ? this.length_.toString() : '-') +
        (this.angle_ !== undefined ? this.angle_.toString() : '-');
    this.checksums_ = [checksum, strokeChecksum, fillChecksum,
      this.width_, this.length_, this.angle_];
  }

  return this.checksums_[0];
};
