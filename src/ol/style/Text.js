/**
 * @module ol/style/Text
 */
import Fill from './Fill.js';
import TextPlacement from './TextPlacement.js';
import {toSize} from '../size.js';

/**
 * The default fill color to use if no fill was set at construction time; a
 * blackish `#333`.
 *
 * @const {string}
 */
const DEFAULT_FILL_COLOR = '#333';

/**
 * @typedef {Object} Options
 * @property {string} [font] Font style as CSS 'font' value, see:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font. Default is '10px sans-serif'
 * @property {number} [maxAngle=Math.PI/4] When `placement` is set to `'line'`, allow a maximum angle between adjacent characters.
 * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
 * @property {number} [offsetX=0] Horizontal text offset in pixels. A positive will shift the text right.
 * @property {number} [offsetY=0] Vertical text offset in pixels. A positive will shift the text down.
 * @property {boolean} [overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
 * the width of the polygon at the label position or the length of the path that it follows.
 * @property {import("./TextPlacement.js").default|string} [placement='point'] Text placement.
 * @property {number|import("../size.js").Size} [scale] Scale.
 * @property {boolean} [rotateWithView=false] Whether to rotate the text with the view.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {string|Array<string>} [text] Text content or rich text content. For plain text provide a string, which can
 * contain line breaks (`\n`). For rich text provide an array of text/font tuples. A tuple consists of the text to
 * render and the font to use (or `''` to use the text style's font). A line break has to be a separate tuple (i.e. `'\n', ''`).
 * **Example:** `['foo', 'bold 10px sans-serif', ' bar', 'italic 10px sans-serif', ' baz', '']` will yield "**foo** *bar* baz".
 * **Note:** Rich text is not supported for the immediate rendering API.
 * @property {string} [textAlign] Text alignment. Possible values: 'left', 'right', 'center', 'end' or 'start'.
 * Default is 'center' for `placement: 'point'`. For `placement: 'line'`, the default is to let the renderer choose a
 * placement where `maxAngle` is not exceeded.
 * @property {string} [textBaseline='middle'] Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'.
 * @property {import("./Fill.js").default} [fill] Fill style. If none is provided, we'll use a dark fill-style (#333).
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./Fill.js").default} [backgroundFill] Fill style for the text background when `placement` is
 * `'point'`. Default is no fill.
 * @property {import("./Stroke.js").default} [backgroundStroke] Stroke style for the text background  when `placement`
 * is `'point'`. Default is no stroke.
 * @property {Array<number>} [padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
 * values in the array is `[top, right, bottom, left]`.
 */

/**
 * @classdesc
 * Set text style for vector features.
 * @api
 */
class Text {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    /**
     * @private
     * @type {string|undefined}
     */
    this.font_ = options.font;

    /**
     * @private
     * @type {number|undefined}
     */
    this.rotation_ = options.rotation;

    /**
     * @private
     * @type {boolean|undefined}
     */
    this.rotateWithView_ = options.rotateWithView;

    /**
     * @private
     * @type {number|import("../size.js").Size|undefined}
     */
    this.scale_ = options.scale;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.scaleArray_ = toSize(options.scale !== undefined ? options.scale : 1);

    /**
     * @private
     * @type {string|Array<string>|undefined}
     */
    this.text_ = options.text;

    /**
     * @private
     * @type {string|undefined}
     */
    this.textAlign_ = options.textAlign;

    /**
     * @private
     * @type {string|undefined}
     */
    this.textBaseline_ = options.textBaseline;

    /**
     * @private
     * @type {import("./Fill.js").default}
     */
    this.fill_ =
      options.fill !== undefined
        ? options.fill
        : new Fill({color: DEFAULT_FILL_COLOR});

    /**
     * @private
     * @type {number}
     */
    this.maxAngle_ =
      options.maxAngle !== undefined ? options.maxAngle : Math.PI / 4;

    /**
     * @private
     * @type {import("./TextPlacement.js").default|string}
     */
    this.placement_ =
      options.placement !== undefined ? options.placement : TextPlacement.POINT;

    /**
     * @private
     * @type {boolean}
     */
    this.overflow_ = !!options.overflow;

    /**
     * @private
     * @type {import("./Stroke.js").default}
     */
    this.stroke_ = options.stroke !== undefined ? options.stroke : null;

    /**
     * @private
     * @type {number}
     */
    this.offsetX_ = options.offsetX !== undefined ? options.offsetX : 0;

    /**
     * @private
     * @type {number}
     */
    this.offsetY_ = options.offsetY !== undefined ? options.offsetY : 0;

    /**
     * @private
     * @type {import("./Fill.js").default}
     */
    this.backgroundFill_ = options.backgroundFill
      ? options.backgroundFill
      : null;

    /**
     * @private
     * @type {import("./Stroke.js").default}
     */
    this.backgroundStroke_ = options.backgroundStroke
      ? options.backgroundStroke
      : null;

    /**
     * @private
     * @type {Array<number>|null}
     */
    this.padding_ = options.padding === undefined ? null : options.padding;
  }

  /**
   * Clones the style.
   * @return {Text} The cloned style.
   * @api
   */
  clone() {
    const scale = this.getScale();
    return new Text({
      font: this.getFont(),
      placement: this.getPlacement(),
      maxAngle: this.getMaxAngle(),
      overflow: this.getOverflow(),
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
      scale: Array.isArray(scale) ? scale.slice() : scale,
      text: this.getText(),
      textAlign: this.getTextAlign(),
      textBaseline: this.getTextBaseline(),
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      offsetX: this.getOffsetX(),
      offsetY: this.getOffsetY(),
      backgroundFill: this.getBackgroundFill()
        ? this.getBackgroundFill().clone()
        : undefined,
      backgroundStroke: this.getBackgroundStroke()
        ? this.getBackgroundStroke().clone()
        : undefined,
      padding: this.getPadding() || undefined,
    });
  }

  /**
   * Get the `overflow` configuration.
   * @return {boolean} Let text overflow the length of the path they follow.
   * @api
   */
  getOverflow() {
    return this.overflow_;
  }

  /**
   * Get the font name.
   * @return {string|undefined} Font.
   * @api
   */
  getFont() {
    return this.font_;
  }

  /**
   * Get the maximum angle between adjacent characters.
   * @return {number} Angle in radians.
   * @api
   */
  getMaxAngle() {
    return this.maxAngle_;
  }

  /**
   * Get the label placement.
   * @return {import("./TextPlacement.js").default|string} Text placement.
   * @api
   */
  getPlacement() {
    return this.placement_;
  }

  /**
   * Get the x-offset for the text.
   * @return {number} Horizontal text offset.
   * @api
   */
  getOffsetX() {
    return this.offsetX_;
  }

  /**
   * Get the y-offset for the text.
   * @return {number} Vertical text offset.
   * @api
   */
  getOffsetY() {
    return this.offsetY_;
  }

  /**
   * Get the fill style for the text.
   * @return {import("./Fill.js").default} Fill style.
   * @api
   */
  getFill() {
    return this.fill_;
  }

  /**
   * Determine whether the text rotates with the map.
   * @return {boolean|undefined} Rotate with map.
   * @api
   */
  getRotateWithView() {
    return this.rotateWithView_;
  }

  /**
   * Get the text rotation.
   * @return {number|undefined} Rotation.
   * @api
   */
  getRotation() {
    return this.rotation_;
  }

  /**
   * Get the text scale.
   * @return {number|import("../size.js").Size|undefined} Scale.
   * @api
   */
  getScale() {
    return this.scale_;
  }

  /**
   * Get the symbolizer scale array.
   * @return {import("../size.js").Size} Scale array.
   */
  getScaleArray() {
    return this.scaleArray_;
  }

  /**
   * Get the stroke style for the text.
   * @return {import("./Stroke.js").default} Stroke style.
   * @api
   */
  getStroke() {
    return this.stroke_;
  }

  /**
   * Get the text to be rendered.
   * @return {string|Array<string>|undefined} Text.
   * @api
   */
  getText() {
    return this.text_;
  }

  /**
   * Get the text alignment.
   * @return {string|undefined} Text align.
   * @api
   */
  getTextAlign() {
    return this.textAlign_;
  }

  /**
   * Get the text baseline.
   * @return {string|undefined} Text baseline.
   * @api
   */
  getTextBaseline() {
    return this.textBaseline_;
  }

  /**
   * Get the background fill style for the text.
   * @return {import("./Fill.js").default} Fill style.
   * @api
   */
  getBackgroundFill() {
    return this.backgroundFill_;
  }

  /**
   * Get the background stroke style for the text.
   * @return {import("./Stroke.js").default} Stroke style.
   * @api
   */
  getBackgroundStroke() {
    return this.backgroundStroke_;
  }

  /**
   * Get the padding for the text.
   * @return {Array<number>|null} Padding.
   * @api
   */
  getPadding() {
    return this.padding_;
  }

  /**
   * Set the `overflow` property.
   *
   * @param {boolean} overflow Let text overflow the path that it follows.
   * @api
   */
  setOverflow(overflow) {
    this.overflow_ = overflow;
  }

  /**
   * Set the font.
   *
   * @param {string|undefined} font Font.
   * @api
   */
  setFont(font) {
    this.font_ = font;
  }

  /**
   * Set the maximum angle between adjacent characters.
   *
   * @param {number} maxAngle Angle in radians.
   * @api
   */
  setMaxAngle(maxAngle) {
    this.maxAngle_ = maxAngle;
  }

  /**
   * Set the x offset.
   *
   * @param {number} offsetX Horizontal text offset.
   * @api
   */
  setOffsetX(offsetX) {
    this.offsetX_ = offsetX;
  }

  /**
   * Set the y offset.
   *
   * @param {number} offsetY Vertical text offset.
   * @api
   */
  setOffsetY(offsetY) {
    this.offsetY_ = offsetY;
  }

  /**
   * Set the text placement.
   *
   * @param {import("./TextPlacement.js").default|string} placement Placement.
   * @api
   */
  setPlacement(placement) {
    this.placement_ = placement;
  }

  /**
   * Set whether to rotate the text with the view.
   *
   * @param {boolean} rotateWithView Rotate with map.
   * @api
   */
  setRotateWithView(rotateWithView) {
    this.rotateWithView_ = rotateWithView;
  }

  /**
   * Set the fill.
   *
   * @param {import("./Fill.js").default} fill Fill style.
   * @api
   */
  setFill(fill) {
    this.fill_ = fill;
  }

  /**
   * Set the rotation.
   *
   * @param {number|undefined} rotation Rotation.
   * @api
   */
  setRotation(rotation) {
    this.rotation_ = rotation;
  }

  /**
   * Set the scale.
   *
   * @param {number|import("../size.js").Size|undefined} scale Scale.
   * @api
   */
  setScale(scale) {
    this.scale_ = scale;
    this.scaleArray_ = toSize(scale !== undefined ? scale : 1);
  }

  /**
   * Set the stroke.
   *
   * @param {import("./Stroke.js").default} stroke Stroke style.
   * @api
   */
  setStroke(stroke) {
    this.stroke_ = stroke;
  }

  /**
   * Set the text.
   *
   * @param {string|undefined} text Text.
   * @api
   */
  setText(text) {
    this.text_ = text;
  }

  /**
   * Set the text alignment.
   *
   * @param {string|undefined} textAlign Text align.
   * @api
   */
  setTextAlign(textAlign) {
    this.textAlign_ = textAlign;
  }

  /**
   * Set the text baseline.
   *
   * @param {string|undefined} textBaseline Text baseline.
   * @api
   */
  setTextBaseline(textBaseline) {
    this.textBaseline_ = textBaseline;
  }

  /**
   * Set the background fill.
   *
   * @param {import("./Fill.js").default} fill Fill style.
   * @api
   */
  setBackgroundFill(fill) {
    this.backgroundFill_ = fill;
  }

  /**
   * Set the background stroke.
   *
   * @param {import("./Stroke.js").default} stroke Stroke style.
   * @api
   */
  setBackgroundStroke(stroke) {
    this.backgroundStroke_ = stroke;
  }

  /**
   * Set the padding (`[top, right, bottom, left]`).
   *
   * @param {Array<number>|null} padding Padding.
   * @api
   */
  setPadding(padding) {
    this.padding_ = padding;
  }
}

export default Text;
