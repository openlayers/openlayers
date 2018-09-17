/**
 * @module ol/style/RegularShape
 */

import {asString} from '../color.js';
import {asColorLike} from '../colorlike.js';
import {createCanvasContext2D} from '../dom.js';
import {CANVAS_LINE_DASH} from '../has.js';
import ImageState from '../ImageState.js';
import {defaultStrokeStyle, defaultFillStyle, defaultLineCap, defaultLineWidth, defaultLineJoin, defaultMiterLimit} from '../render/canvas.js';
import ImageStyle from '../style/Image.js';


/**
 * Specify radius for regular polygons, or radius1 and radius2 for stars.
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} points Number of points for stars and regular polygons. In case of a polygon, the number of points
 * is the number of sides.
 * @property {number} [radius] Radius of a regular polygon.
 * @property {number} [radius1] Outer radius of a star.
 * @property {number} [radius2] Inner radius of a star.
 * @property {number} [angle=0] Shape's angle in radians. A value of 0 will have one of the shape's point facing up.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view.
 * @property {import("./AtlasManager.js").default} [atlasManager] The atlas manager to use for this symbol. When
 * using WebGL it is recommended to use an atlas manager to avoid texture switching. If an atlas manager is given, the
 * symbol is added to an atlas. By default no atlas manager is used.
 */


/**
 * @typedef {Object} RenderOptions
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {number} strokeWidth
 * @property {number} size
 * @property {string} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {string} lineJoin
 * @property {number} miterLimit
 */


/**
 * @classdesc
 * Set regular shape style for vector features. The resulting shape will be
 * a regular polygon when `radius` is provided, or a star when `radius1` and
 * `radius2` are provided.
 * @api
 */
class RegularShape extends ImageStyle {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    /**
     * @type {boolean}
     */
    const rotateWithView = options.rotateWithView !== undefined ?
      options.rotateWithView : false;

    super({
      opacity: 1,
      rotateWithView: rotateWithView,
      rotation: options.rotation !== undefined ? options.rotation : 0,
      scale: 1
    });

    /**
     * @private
     * @type {Array<string|number>}
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
     * @type {import("./Fill.js").default}
     */
    this.fill_ = options.fill !== undefined ? options.fill : null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.origin_ = [0, 0];

    /**
     * @private
     * @type {number}
     */
    this.points_ = options.points;

    /**
     * @protected
     * @type {number}
     */
    this.radius_ = /** @type {number} */ (options.radius !== undefined ?
      options.radius : options.radius1);

    /**
     * @private
     * @type {number|undefined}
     */
    this.radius2_ = options.radius2;

    /**
     * @private
     * @type {number}
     */
    this.angle_ = options.angle !== undefined ? options.angle : 0;

    /**
     * @private
     * @type {import("./Stroke.js").default}
     */
    this.stroke_ = options.stroke !== undefined ? options.stroke : null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.anchor_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.size_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.imageSize_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.hitDetectionImageSize_ = null;

    /**
     * @protected
     * @type {import("./AtlasManager.js").default|undefined}
     */
    this.atlasManager_ = options.atlasManager;

    this.render_(this.atlasManager_);

  }

  /**
   * Clones the style. If an atlasmanager was provided to the original style it will be used in the cloned style, too.
   * @return {RegularShape} The cloned style.
   * @api
   */
  clone() {
    const style = new RegularShape({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      points: this.getPoints(),
      radius: this.getRadius(),
      radius2: this.getRadius2(),
      angle: this.getAngle(),
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
      atlasManager: this.atlasManager_
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  }

  /**
   * @inheritDoc
   * @api
   */
  getAnchor() {
    return this.anchor_;
  }

  /**
   * Get the angle used in generating the shape.
   * @return {number} Shape's rotation in radians.
   * @api
   */
  getAngle() {
    return this.angle_;
  }

  /**
   * Get the fill style for the shape.
   * @return {import("./Fill.js").default} Fill style.
   * @api
   */
  getFill() {
    return this.fill_;
  }

  /**
   * @inheritDoc
   */
  getHitDetectionImage(pixelRatio) {
    return this.hitDetectionCanvas_;
  }

  /**
   * @inheritDoc
   * @api
   */
  getImage(pixelRatio) {
    return this.canvas_;
  }

  /**
   * @inheritDoc
   */
  getImageSize() {
    return this.imageSize_;
  }

  /**
   * @inheritDoc
   */
  getHitDetectionImageSize() {
    return this.hitDetectionImageSize_;
  }

  /**
   * @inheritDoc
   */
  getImageState() {
    return ImageState.LOADED;
  }

  /**
   * @inheritDoc
   * @api
   */
  getOrigin() {
    return this.origin_;
  }

  /**
   * Get the number of points for generating the shape.
   * @return {number} Number of points for stars and regular polygons.
   * @api
   */
  getPoints() {
    return this.points_;
  }

  /**
   * Get the (primary) radius for the shape.
   * @return {number} Radius.
   * @api
   */
  getRadius() {
    return this.radius_;
  }

  /**
   * Get the secondary radius for the shape.
   * @return {number|undefined} Radius2.
   * @api
   */
  getRadius2() {
    return this.radius2_;
  }

  /**
   * @inheritDoc
   * @api
   */
  getSize() {
    return this.size_;
  }

  /**
   * Get the stroke style for the shape.
   * @return {import("./Stroke.js").default} Stroke style.
   * @api
   */
  getStroke() {
    return this.stroke_;
  }

  /**
   * @inheritDoc
   */
  listenImageChange(listener, thisArg) {
    return undefined;
  }

  /**
   * @inheritDoc
   */
  load() {}

  /**
   * @inheritDoc
   */
  unlistenImageChange(listener, thisArg) {}

  /**
   * @protected
   * @param {import("./AtlasManager.js").default|undefined} atlasManager An atlas manager.
   */
  render_(atlasManager) {
    let imageSize;
    let lineCap = '';
    let lineJoin = '';
    let miterLimit = 0;
    let lineDash = null;
    let lineDashOffset = 0;
    let strokeStyle;
    let strokeWidth = 0;

    if (this.stroke_) {
      strokeStyle = this.stroke_.getColor();
      if (strokeStyle === null) {
        strokeStyle = defaultStrokeStyle;
      }
      strokeStyle = asColorLike(strokeStyle);
      strokeWidth = this.stroke_.getWidth();
      if (strokeWidth === undefined) {
        strokeWidth = defaultLineWidth;
      }
      lineDash = this.stroke_.getLineDash();
      lineDashOffset = this.stroke_.getLineDashOffset();
      if (!CANVAS_LINE_DASH) {
        lineDash = null;
        lineDashOffset = 0;
      }
      lineJoin = this.stroke_.getLineJoin();
      if (lineJoin === undefined) {
        lineJoin = defaultLineJoin;
      }
      lineCap = this.stroke_.getLineCap();
      if (lineCap === undefined) {
        lineCap = defaultLineCap;
      }
      miterLimit = this.stroke_.getMiterLimit();
      if (miterLimit === undefined) {
        miterLimit = defaultMiterLimit;
      }
    }

    let size = 2 * (this.radius_ + strokeWidth) + 1;

    /** @type {RenderOptions} */
    const renderOptions = {
      strokeStyle: strokeStyle,
      strokeWidth: strokeWidth,
      size: size,
      lineCap: lineCap,
      lineDash: lineDash,
      lineDashOffset: lineDashOffset,
      lineJoin: lineJoin,
      miterLimit: miterLimit
    };

    if (atlasManager === undefined) {
      // no atlas manager is used, create a new canvas
      const context = createCanvasContext2D(size, size);
      this.canvas_ = context.canvas;

      // canvas.width and height are rounded to the closest integer
      size = this.canvas_.width;
      imageSize = size;

      this.draw_(renderOptions, context, 0, 0);

      this.createHitDetectionCanvas_(renderOptions);
    } else {
      // an atlas manager is used, add the symbol to an atlas
      size = Math.round(size);

      const hasCustomHitDetectionImage = !this.fill_;
      let renderHitDetectionCallback;
      if (hasCustomHitDetectionImage) {
        // render the hit-detection image into a separate atlas image
        renderHitDetectionCallback =
            this.drawHitDetectionCanvas_.bind(this, renderOptions);
      }

      const id = this.getChecksum();
      const info = atlasManager.add(
        id, size, size, this.draw_.bind(this, renderOptions),
        renderHitDetectionCallback);

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
  }

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The rendering context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  draw_(renderOptions, context, x, y) {
    let i, angle0, radiusC;
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    context.beginPath();

    let points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2, renderOptions.size / 2,
        this.radius_, 0, 2 * Math.PI, true);
    } else {
      const radius2 = (this.radius2_ !== undefined) ? this.radius2_
        : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      for (i = 0; i <= points; i++) {
        angle0 = i * 2 * Math.PI / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0));
      }
    }


    if (this.fill_) {
      let color = this.fill_.getColor();
      if (color === null) {
        color = defaultFillStyle;
      }
      context.fillStyle = asColorLike(color);
      context.fill();
    }
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash);
        context.lineDashOffset = renderOptions.lineDashOffset;
      }
      context.lineCap = /** @type {CanvasLineCap} */ (renderOptions.lineCap);
      context.lineJoin = /** @type {CanvasLineJoin} */ (renderOptions.lineJoin);
      context.miterLimit = renderOptions.miterLimit;
      context.stroke();
    }
    context.closePath();
  }

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   */
  createHitDetectionCanvas_(renderOptions) {
    this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size];
    if (this.fill_) {
      this.hitDetectionCanvas_ = this.canvas_;
      return;
    }

    // if no fill style is set, create an extra hit-detection image with a
    // default fill style
    const context = createCanvasContext2D(renderOptions.size, renderOptions.size);
    this.hitDetectionCanvas_ = context.canvas;

    this.drawHitDetectionCanvas_(renderOptions, context, 0, 0);
  }

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  drawHitDetectionCanvas_(renderOptions, context, x, y) {
    // reset transform
    context.setTransform(1, 0, 0, 1, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    context.beginPath();

    let points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2, renderOptions.size / 2,
        this.radius_, 0, 2 * Math.PI, true);
    } else {
      const radius2 = (this.radius2_ !== undefined) ? this.radius2_
        : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      let i, radiusC, angle0;
      for (i = 0; i <= points; i++) {
        angle0 = i * 2 * Math.PI / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0));
      }
    }

    context.fillStyle = asString(defaultFillStyle);
    context.fill();
    if (this.stroke_) {
      context.strokeStyle = renderOptions.strokeStyle;
      context.lineWidth = renderOptions.strokeWidth;
      if (renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash);
        context.lineDashOffset = renderOptions.lineDashOffset;
      }
      context.stroke();
    }
    context.closePath();
  }

  /**
   * @return {string} The checksum.
   */
  getChecksum() {
    const strokeChecksum = this.stroke_ ?
      this.stroke_.getChecksum() : '-';
    const fillChecksum = this.fill_ ?
      this.fill_.getChecksum() : '-';

    const recalculate = !this.checksums_ ||
        (strokeChecksum != this.checksums_[1] ||
        fillChecksum != this.checksums_[2] ||
        this.radius_ != this.checksums_[3] ||
        this.radius2_ != this.checksums_[4] ||
        this.angle_ != this.checksums_[5] ||
        this.points_ != this.checksums_[6]);

    if (recalculate) {
      const checksum = 'r' + strokeChecksum + fillChecksum +
          (this.radius_ !== undefined ? this.radius_.toString() : '-') +
          (this.radius2_ !== undefined ? this.radius2_.toString() : '-') +
          (this.angle_ !== undefined ? this.angle_.toString() : '-') +
          (this.points_ !== undefined ? this.points_.toString() : '-');
      this.checksums_ = [checksum, strokeChecksum, fillChecksum,
        this.radius_, this.radius2_, this.angle_, this.points_];
    }

    return /** @type {string} */ (this.checksums_[0]);
  }
}


export default RegularShape;
