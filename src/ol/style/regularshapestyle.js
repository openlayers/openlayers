goog.provide('ol.style.RegularShape');

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
 * Set regular shape style for vector features. The resulting shape will be
 * a regular polygon when `radius` is provided, or a star when `radius1` and
 * `radius2` are provided.
 *
 * @constructor
 * @param {olx.style.RegularShapeOptions} options Options.
 * @extends {ol.style.Image}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.RegularShape = function(options) {

  goog.asserts.assert(
      options.radius !== undefined || options.radius1 !== undefined,
      'must provide either "radius" or "radius1"');

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
  this.points_ = options.points;

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
  this.radius2_ =
      options.radius2 !== undefined ? options.radius2 : this.radius_;

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

  goog.base(this, {
    opacity: 1,
    rotateWithView: false,
    rotation: options.rotation !== undefined ? options.rotation : 0,
    scale: 1,
    snapToPixel: snapToPixel
  });

};
goog.inherits(ol.style.RegularShape, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.RegularShape.prototype.getAnchor = function() {
  return this.anchor_;
};


/**
 * Get the angle used in generating the shape.
 * @return {number} Shape's rotation in radians.
 * @api
 */
ol.style.RegularShape.prototype.getAngle = function() {
  return this.angle_;
};


/**
 * Get the fill style for the shape.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.RegularShape.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.hitDetectionCanvas_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.RegularShape.prototype.getImage = function(pixelRatio) {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.getImageSize = function() {
  return this.imageSize_;
};


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.getHitDetectionImageSize = function() {
  return this.hitDetectionImageSize_;
};


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.getImageState = function() {
  return ol.style.ImageState.LOADED;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.RegularShape.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * Get the number of points for generating the shape.
 * @return {number} Number of points for stars and regular polygons.
 * @api
 */
ol.style.RegularShape.prototype.getPoints = function() {
  return this.points_;
};


/**
 * Get the (primary) radius for the shape.
 * @return {number} Radius.
 * @api
 */
ol.style.RegularShape.prototype.getRadius = function() {
  return this.radius_;
};


/**
 * Get the secondary radius for the shape.
 * @return {number} Radius2.
 * @api
 */
ol.style.RegularShape.prototype.getRadius2 = function() {
  return this.radius2_;
};


/**
 * @inheritDoc
 * @api
 */
ol.style.RegularShape.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke style for the shape.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.RegularShape.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.listenImageChange = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.load = ol.nullFunction;


/**
 * @inheritDoc
 */
ol.style.RegularShape.prototype.unlistenImageChange = ol.nullFunction;


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
ol.style.RegularShape.RenderOptions;


/**
 * @private
 * @param {ol.style.AtlasManager|undefined} atlasManager
 */
ol.style.RegularShape.prototype.render_ = function(atlasManager) {
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

  /** @type {ol.style.RegularShape.RenderOptions} */
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
 * @param {ol.style.RegularShape.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.RegularShape.prototype.draw_ = function(renderOptions, context, x, y) {
  var i, angle0, radiusC;
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();
  if (this.radius2_ !== this.radius_) {
    this.points_ = 2 * this.points_;
  }
  for (i = 0; i <= this.points_; i++) {
    angle0 = i * 2 * Math.PI / this.points_ - Math.PI / 2 + this.angle_;
    radiusC = i % 2 === 0 ? this.radius_ : this.radius2_;
    context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
                   renderOptions.size / 2 + radiusC * Math.sin(angle0));
  }

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
 * @param {ol.style.RegularShape.RenderOptions} renderOptions
 */
ol.style.RegularShape.prototype.createHitDetectionCanvas_ =
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
 * @param {ol.style.RegularShape.RenderOptions} renderOptions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x The origin for the symbol (x).
 * @param {number} y The origin for the symbol (y).
 */
ol.style.RegularShape.prototype.drawHitDetectionCanvas_ =
    function(renderOptions, context, x, y) {
  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0);

  // then move to (x, y)
  context.translate(x, y);

  context.beginPath();
  if (this.radius2_ !== this.radius_) {
    this.points_ = 2 * this.points_;
  }
  var i, radiusC, angle0;
  for (i = 0; i <= this.points_; i++) {
    angle0 = i * 2 * Math.PI / this.points_ - Math.PI / 2 + this.angle_;
    radiusC = i % 2 === 0 ? this.radius_ : this.radius2_;
    context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
                   renderOptions.size / 2 + radiusC * Math.sin(angle0));
  }

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
ol.style.RegularShape.prototype.getChecksum = function() {
  var strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
  var fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

  var recalculate = !this.checksums_ ||
      (strokeChecksum != this.checksums_[1] ||
      fillChecksum != this.checksums_[2] ||
      this.radius_ != this.checksums_[3] ||
      this.radius2_ != this.checksums_[4] ||
      this.angle_ != this.checksums_[5] ||
      this.points_ != this.checksums_[6]);

  if (recalculate) {
    var checksum = 'r' + strokeChecksum + fillChecksum +
        (this.radius_ !== undefined ? this.radius_.toString() : '-') +
        (this.radius2_ !== undefined ? this.radius2_.toString() : '-') +
        (this.angle_ !== undefined ? this.angle_.toString() : '-') +
        (this.points_ !== undefined ? this.points_.toString() : '-');
    this.checksums_ = [checksum, strokeChecksum, fillChecksum,
      this.radius_, this.radius2_, this.angle_, this.points_];
  }

  return this.checksums_[0];
};
