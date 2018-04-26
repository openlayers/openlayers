/**
 * @module ol/style/Text
 */
import Fill from '../style/Fill.js';
import TextPlacement from '../style/TextPlacement.js';


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
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}. Default is '10px sans-serif'
 * @property {number} [maxAngle] When `placement` is set to `'line'`, allow a maximum angle between adjacent characters.
 * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
 * @property {number} [offsetX=0] Horizontal text offset in pixels. A positive will shift the text right.
 * @property {number} [offsetY=0] Vertical text offset in pixels. A positive will shift the text down.
 * @property {boolean} [overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
 * the width of the polygon at the label position or the length of the path that it follows.
 * @property {module:ol/style/TextPlacement|string} [placement] Text placement.
 * @property {number} [scale] Scale.
 * @property {boolean} [rotateWithView=false] Whether to rotate the text with the view.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {string} [text] Text content.
 * @property {string} [textAlign] Text alignment. Possible values: 'left', 'right', 'center', 'end' or 'start'.
 * Default is 'center' for `placement: 'point'`. For `placement: 'line'`, the default is to let the renderer choose a
 * placement where `maxAngle` is not exceeded.
 * @property {string} [textBaseline='middle'] Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'.
 * @property {module:ol/style/Fill} [fill] Fill style. If none is provided, we'll use a dark fill-style (#333).
 * @property {module:ol/style/Stroke} [stroke] Stroke style.
 * @property {module:ol/style/Fill} [backgroundFill] Fill style for the text background when `placement` is
 * `'point'`. Default is no fill.
 * @property {module:ol/style/Stroke} [backgroundStroke] Stroke style for the text background  when `placement`
 * is `'point'`. Default is no stroke.
 * @property {Array.<number>} [padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
 * values in the array is `[top, right, bottom, left]`.
 */


/**
 * @classdesc
 * Set text style for vector features.
 *
 * @constructor
 * @param {module:ol/style/Text~Options=} opt_options Options.
 * @api
 */
const Text = function(opt_options) {

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
   * @type {number|undefined}
   */
  this.scale_ = options.scale;

  /**
   * @private
   * @type {string|undefined}
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
   * @type {module:ol/style/Fill}
   */
  this.fill_ = options.fill !== undefined ? options.fill :
    new Fill({color: DEFAULT_FILL_COLOR});

  /**
   * @private
   * @type {number}
   */
  this.maxAngle_ = options.maxAngle !== undefined ? options.maxAngle : Math.PI / 4;

  /**
   * @private
   * @type {module:ol/style/TextPlacement|string}
   */
  this.placement_ = options.placement !== undefined ? options.placement : TextPlacement.POINT;

  /**
   * @private
   * @type {boolean}
   */
  this.overflow_ = !!options.overflow;

  /**
   * @private
   * @type {module:ol/style/Stroke}
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
   * @type {module:ol/style/Fill}
   */
  this.backgroundFill_ = options.backgroundFill ? options.backgroundFill : null;

  /**
   * @private
   * @type {module:ol/style/Stroke}
   */
  this.backgroundStroke_ = options.backgroundStroke ? options.backgroundStroke : null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.padding_ = options.padding === undefined ? null : options.padding;
};


/**
 * Clones the style.
 * @return {module:ol/style/Text} The cloned style.
 * @api
 */
Text.prototype.clone = function() {
  return new Text({
    font: this.getFont(),
    placement: this.getPlacement(),
    maxAngle: this.getMaxAngle(),
    overflow: this.getOverflow(),
    rotation: this.getRotation(),
    rotateWithView: this.getRotateWithView(),
    scale: this.getScale(),
    text: this.getText(),
    textAlign: this.getTextAlign(),
    textBaseline: this.getTextBaseline(),
    fill: this.getFill() ? this.getFill().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    offsetX: this.getOffsetX(),
    offsetY: this.getOffsetY(),
    backgroundFill: this.getBackgroundFill() ? this.getBackgroundFill().clone() : undefined,
    backgroundStroke: this.getBackgroundStroke() ? this.getBackgroundStroke().clone() : undefined
  });
};


/**
 * Get the `overflow` configuration.
 * @return {boolean} Let text overflow the length of the path they follow.
 * @api
 */
Text.prototype.getOverflow = function() {
  return this.overflow_;
};


/**
 * Get the font name.
 * @return {string|undefined} Font.
 * @api
 */
Text.prototype.getFont = function() {
  return this.font_;
};


/**
 * Get the maximum angle between adjacent characters.
 * @return {number} Angle in radians.
 * @api
 */
Text.prototype.getMaxAngle = function() {
  return this.maxAngle_;
};


/**
 * Get the label placement.
 * @return {module:ol/style/TextPlacement|string} Text placement.
 * @api
 */
Text.prototype.getPlacement = function() {
  return this.placement_;
};


/**
 * Get the x-offset for the text.
 * @return {number} Horizontal text offset.
 * @api
 */
Text.prototype.getOffsetX = function() {
  return this.offsetX_;
};


/**
 * Get the y-offset for the text.
 * @return {number} Vertical text offset.
 * @api
 */
Text.prototype.getOffsetY = function() {
  return this.offsetY_;
};


/**
 * Get the fill style for the text.
 * @return {module:ol/style/Fill} Fill style.
 * @api
 */
Text.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Determine whether the text rotates with the map.
 * @return {boolean|undefined} Rotate with map.
 * @api
 */
Text.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * Get the text rotation.
 * @return {number|undefined} Rotation.
 * @api
 */
Text.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the text scale.
 * @return {number|undefined} Scale.
 * @api
 */
Text.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Get the stroke style for the text.
 * @return {module:ol/style/Stroke} Stroke style.
 * @api
 */
Text.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Get the text to be rendered.
 * @return {string|undefined} Text.
 * @api
 */
Text.prototype.getText = function() {
  return this.text_;
};


/**
 * Get the text alignment.
 * @return {string|undefined} Text align.
 * @api
 */
Text.prototype.getTextAlign = function() {
  return this.textAlign_;
};


/**
 * Get the text baseline.
 * @return {string|undefined} Text baseline.
 * @api
 */
Text.prototype.getTextBaseline = function() {
  return this.textBaseline_;
};


/**
 * Get the background fill style for the text.
 * @return {module:ol/style/Fill} Fill style.
 * @api
 */
Text.prototype.getBackgroundFill = function() {
  return this.backgroundFill_;
};


/**
 * Get the background stroke style for the text.
 * @return {module:ol/style/Stroke} Stroke style.
 * @api
 */
Text.prototype.getBackgroundStroke = function() {
  return this.backgroundStroke_;
};


/**
 * Get the padding for the text.
 * @return {Array.<number>} Padding.
 * @api
 */
Text.prototype.getPadding = function() {
  return this.padding_;
};


/**
 * Set the `overflow` property.
 *
 * @param {boolean} overflow Let text overflow the path that it follows.
 * @api
 */
Text.prototype.setOverflow = function(overflow) {
  this.overflow_ = overflow;
};


/**
 * Set the font.
 *
 * @param {string|undefined} font Font.
 * @api
 */
Text.prototype.setFont = function(font) {
  this.font_ = font;
};


/**
 * Set the maximum angle between adjacent characters.
 *
 * @param {number} maxAngle Angle in radians.
 * @api
 */
Text.prototype.setMaxAngle = function(maxAngle) {
  this.maxAngle_ = maxAngle;
};


/**
 * Set the x offset.
 *
 * @param {number} offsetX Horizontal text offset.
 * @api
 */
Text.prototype.setOffsetX = function(offsetX) {
  this.offsetX_ = offsetX;
};


/**
 * Set the y offset.
 *
 * @param {number} offsetY Vertical text offset.
 * @api
 */
Text.prototype.setOffsetY = function(offsetY) {
  this.offsetY_ = offsetY;
};


/**
 * Set the text placement.
 *
 * @param {module:ol/style/TextPlacement|string} placement Placement.
 * @api
 */
Text.prototype.setPlacement = function(placement) {
  this.placement_ = placement;
};


/**
 * Set the fill.
 *
 * @param {module:ol/style/Fill} fill Fill style.
 * @api
 */
Text.prototype.setFill = function(fill) {
  this.fill_ = fill;
};


/**
 * Set the rotation.
 *
 * @param {number|undefined} rotation Rotation.
 * @api
 */
Text.prototype.setRotation = function(rotation) {
  this.rotation_ = rotation;
};


/**
 * Set the scale.
 *
 * @param {number|undefined} scale Scale.
 * @api
 */
Text.prototype.setScale = function(scale) {
  this.scale_ = scale;
};


/**
 * Set the stroke.
 *
 * @param {module:ol/style/Stroke} stroke Stroke style.
 * @api
 */
Text.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
};


/**
 * Set the text.
 *
 * @param {string|undefined} text Text.
 * @api
 */
Text.prototype.setText = function(text) {
  this.text_ = text;
};


/**
 * Set the text alignment.
 *
 * @param {string|undefined} textAlign Text align.
 * @api
 */
Text.prototype.setTextAlign = function(textAlign) {
  this.textAlign_ = textAlign;
};


/**
 * Set the text baseline.
 *
 * @param {string|undefined} textBaseline Text baseline.
 * @api
 */
Text.prototype.setTextBaseline = function(textBaseline) {
  this.textBaseline_ = textBaseline;
};


/**
 * Set the background fill.
 *
 * @param {module:ol/style/Fill} fill Fill style.
 * @api
 */
Text.prototype.setBackgroundFill = function(fill) {
  this.backgroundFill_ = fill;
};


/**
 * Set the background stroke.
 *
 * @param {module:ol/style/Stroke} stroke Stroke style.
 * @api
 */
Text.prototype.setBackgroundStroke = function(stroke) {
  this.backgroundStroke_ = stroke;
};


/**
 * Set the padding (`[top, right, bottom, left]`).
 *
 * @param {!Array.<number>} padding Padding.
 * @api
 */
Text.prototype.setPadding = function(padding) {
  this.padding_ = padding;
};
export default Text;
