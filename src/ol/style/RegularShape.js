/**
 * @module ol/style/RegularShape
 */

import ImageState from '../ImageState.js';
import ImageStyle from './Image.js';
import {asArray} from '../color.js';
import {asColorLike} from '../colorlike.js';
import {createCanvasContext2D} from '../dom.js';
import {
  defaultFillStyle,
  defaultLineCap,
  defaultLineJoin,
  defaultLineWidth,
  defaultMiterLimit,
  defaultStrokeStyle,
} from '../render/canvas.js';

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
 * @property {Array<number>} [displacement=[0,0]] Displacement of the shape
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view.
 */

/**
 * @typedef {Object} RenderOptions
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {number} strokeWidth
 * @property {number} size
 * @property {CanvasLineCap} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {CanvasLineJoin} lineJoin
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
    const rotateWithView =
      options.rotateWithView !== undefined ? options.rotateWithView : false;

    super({
      opacity: 1,
      rotateWithView: rotateWithView,
      rotation: options.rotation !== undefined ? options.rotation : 0,
      scale: 1,
      displacement:
        options.displacement !== undefined ? options.displacement : [0, 0],
    });

    /**
     * @private
     * @type {Object<number, HTMLCanvasElement>}
     */
    this.canvas_ = {};

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
    this.radius_ =
      options.radius !== undefined ? options.radius : options.radius1;

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

    this.render();
  }

  /**
   * Clones the style.
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
      displacement: this.getDisplacement().slice(),
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  }

  /**
   * Get the anchor point in pixels. The anchor determines the center point for the
   * symbolizer.
   * @return {Array<number>} Anchor.
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
   * @return {HTMLCanvasElement} Image element.
   */
  getHitDetectionImage() {
    if (!this.hitDetectionCanvas_) {
      const renderOptions = this.createRenderOptions();

      this.createHitDetectionCanvas_(renderOptions);
    }
    return this.hitDetectionCanvas_;
  }

  /**
   * Get the image icon.
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLCanvasElement} Image or Canvas element.
   * @api
   */
  getImage(pixelRatio) {
    if (!this.canvas_[pixelRatio || 1]) {
      const renderOptions = this.createRenderOptions();

      const context = createCanvasContext2D(
        renderOptions.size * pixelRatio || 1,
        renderOptions.size * pixelRatio || 1
      );

      this.draw_(renderOptions, context, 0, 0, pixelRatio || 1);

      this.canvas_[pixelRatio || 1] = context.canvas;
    }
    return this.canvas_[pixelRatio || 1];
  }

  /*
   * Get the image pixel ratio.
   * @param {number} pixelRatio Pixel ratio.
   * */
  getPixelRatio(pixelRatio) {
    return pixelRatio;
  }

  /**
   * @return {import("../size.js").Size} Image size.
   */
  getImageSize() {
    return this.imageSize_;
  }

  /**
   * @return {import("../size.js").Size} Size of the hit-detection image.
   */
  getHitDetectionImageSize() {
    return this.hitDetectionImageSize_;
  }

  /**
   * @return {import("../ImageState.js").default} Image state.
   */
  getImageState() {
    return ImageState.LOADED;
  }

  /**
   * Get the origin of the symbolizer.
   * @return {Array<number>} Origin.
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
   * Get the size of the symbolizer (in pixels).
   * @return {import("../size.js").Size} Size.
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
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   */
  listenImageChange(listener) {}

  /**
   * Load not yet loaded URI.
   */
  load() {}

  /**
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   */
  unlistenImageChange(listener) {}

  /**
   * @returns {RenderOptions}  The render options
   * @protected
   */
  createRenderOptions() {
    let lineCap = defaultLineCap;
    let lineJoin = defaultLineJoin;
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

    const size = 2 * (this.radius_ + strokeWidth) + 1;

    return {
      strokeStyle: strokeStyle,
      strokeWidth: strokeWidth,
      size: size,
      lineCap: lineCap,
      lineDash: lineDash,
      lineDashOffset: lineDashOffset,
      lineJoin: lineJoin,
      miterLimit: miterLimit,
    };
  }

  /**
   * @protected
   */
  render() {
    const renderOptions = this.createRenderOptions();

    const context = createCanvasContext2D(
      renderOptions.size,
      renderOptions.size
    );

    this.draw_(renderOptions, context, 0, 0, 1);

    this.canvas_[1] = context.canvas;

    // canvas.width and height are rounded to the closest integer
    const size = context.canvas.width;
    const imageSize = size;
    const displacement = this.getDisplacement();

    this.hitDetectionImageSize_ = [renderOptions.size, renderOptions.size];
    this.createHitDetectionCanvas_(renderOptions);

    this.anchor_ = [size / 2 - displacement[0], size / 2 + displacement[1]];
    this.size_ = [size, size];
    this.imageSize_ = [imageSize, imageSize];
  }

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The rendering context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   * @param {number} pixelRatio The pixel ratio.
   */
  draw_(renderOptions, context, x, y, pixelRatio) {
    let i, angle0, radiusC;

    // reset transform
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // then move to (x, y)
    context.translate(x, y);

    context.beginPath();

    let points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2,
        renderOptions.size / 2,
        this.radius_,
        0,
        2 * Math.PI,
        true
      );
    } else {
      const radius2 =
        this.radius2_ !== undefined ? this.radius2_ : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      for (i = 0; i <= points; i++) {
        angle0 = (i * 2 * Math.PI) / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(
          renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0)
        );
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
      if (context.setLineDash && renderOptions.lineDash) {
        context.setLineDash(renderOptions.lineDash);
        context.lineDashOffset = renderOptions.lineDashOffset;
      }
      context.lineCap = renderOptions.lineCap;
      context.lineJoin = renderOptions.lineJoin;
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
    this.hitDetectionCanvas_ = this.getImage(1);
    if (this.fill_) {
      let color = this.fill_.getColor();

      // determine if fill is transparent (or pattern or gradient)
      let opacity = 0;
      if (typeof color === 'string') {
        color = asArray(color);
      }
      if (color === null) {
        opacity = 1;
      } else if (Array.isArray(color)) {
        opacity = color.length === 4 ? color[3] : 1;
      }
      if (opacity === 0) {
        // if a transparent fill style is set, create an extra hit-detection image
        // with a default fill style
        const context = createCanvasContext2D(
          renderOptions.size,
          renderOptions.size
        );
        this.hitDetectionCanvas_ = context.canvas;

        this.drawHitDetectionCanvas_(renderOptions, context, 0, 0);
      }
    }
  }

  /**
   * @private
   * @param {RenderOptions} renderOptions Render options.
   * @param {CanvasRenderingContext2D} context The context.
   * @param {number} x The origin for the symbol (x).
   * @param {number} y The origin for the symbol (y).
   */
  drawHitDetectionCanvas_(renderOptions, context, x, y) {
    // move to (x, y)
    context.translate(x, y);

    context.beginPath();

    let points = this.points_;
    if (points === Infinity) {
      context.arc(
        renderOptions.size / 2,
        renderOptions.size / 2,
        this.radius_,
        0,
        2 * Math.PI,
        true
      );
    } else {
      const radius2 =
        this.radius2_ !== undefined ? this.radius2_ : this.radius_;
      if (radius2 !== this.radius_) {
        points = 2 * points;
      }
      let i, radiusC, angle0;
      for (i = 0; i <= points; i++) {
        angle0 = (i * 2 * Math.PI) / points - Math.PI / 2 + this.angle_;
        radiusC = i % 2 === 0 ? this.radius_ : radius2;
        context.lineTo(
          renderOptions.size / 2 + radiusC * Math.cos(angle0),
          renderOptions.size / 2 + radiusC * Math.sin(angle0)
        );
      }
    }

    context.fillStyle = defaultFillStyle;
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
}

export default RegularShape;
