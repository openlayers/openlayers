import _ol_style_Fill_ from '../style/fill';

/**
 * @classdesc
 * Set text style for vector features.
 *
 * @constructor
 * @param {olx.style.TextOptions=} opt_options Options.
 * @api
 */
var _ol_style_Text_ = function(opt_options) {

  var options = opt_options || {};

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
   * @type {ol.style.Fill}
   */
  this.fill_ = options.fill !== undefined ? options.fill :
    new _ol_style_Fill_({color: _ol_style_Text_.DEFAULT_FILL_COLOR_});

  /**
   * @private
   * @type {ol.style.Stroke}
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
};


/**
 * The default fill color to use if no fill was set at construction time; a
 * blackish `#333`.
 *
 * @const {string}
 * @private
 */
_ol_style_Text_.DEFAULT_FILL_COLOR_ = '#333';


/**
 * Clones the style.
 * @return {ol.style.Text} The cloned style.
 * @api
 */
_ol_style_Text_.prototype.clone = function() {
  return new _ol_style_Text_({
    font: this.getFont(),
    rotation: this.getRotation(),
    rotateWithView: this.getRotateWithView(),
    scale: this.getScale(),
    text: this.getText(),
    textAlign: this.getTextAlign(),
    textBaseline: this.getTextBaseline(),
    fill: this.getFill() ? this.getFill().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    offsetX: this.getOffsetX(),
    offsetY: this.getOffsetY()
  });
};


/**
 * Get the font name.
 * @return {string|undefined} Font.
 * @api
 */
_ol_style_Text_.prototype.getFont = function() {
  return this.font_;
};


/**
 * Get the x-offset for the text.
 * @return {number} Horizontal text offset.
 * @api
 */
_ol_style_Text_.prototype.getOffsetX = function() {
  return this.offsetX_;
};


/**
 * Get the y-offset for the text.
 * @return {number} Vertical text offset.
 * @api
 */
_ol_style_Text_.prototype.getOffsetY = function() {
  return this.offsetY_;
};


/**
 * Get the fill style for the text.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
_ol_style_Text_.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Determine whether the text rotates with the map.
 * @return {boolean|undefined} Rotate with map.
 * @api
 */
_ol_style_Text_.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * Get the text rotation.
 * @return {number|undefined} Rotation.
 * @api
 */
_ol_style_Text_.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the text scale.
 * @return {number|undefined} Scale.
 * @api
 */
_ol_style_Text_.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Get the stroke style for the text.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
_ol_style_Text_.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Get the text to be rendered.
 * @return {string|undefined} Text.
 * @api
 */
_ol_style_Text_.prototype.getText = function() {
  return this.text_;
};


/**
 * Get the text alignment.
 * @return {string|undefined} Text align.
 * @api
 */
_ol_style_Text_.prototype.getTextAlign = function() {
  return this.textAlign_;
};


/**
 * Get the text baseline.
 * @return {string|undefined} Text baseline.
 * @api
 */
_ol_style_Text_.prototype.getTextBaseline = function() {
  return this.textBaseline_;
};


/**
 * Set the font.
 *
 * @param {string|undefined} font Font.
 * @api
 */
_ol_style_Text_.prototype.setFont = function(font) {
  this.font_ = font;
};


/**
 * Set the x offset.
 *
 * @param {number} offsetX Horizontal text offset.
 * @api
 */
_ol_style_Text_.prototype.setOffsetX = function(offsetX) {
  this.offsetX_ = offsetX;
};


/**
 * Set the y offset.
 *
 * @param {number} offsetY Vertical text offset.
 * @api
 */
_ol_style_Text_.prototype.setOffsetY = function(offsetY) {
  this.offsetY_ = offsetY;
};


/**
 * Set the fill.
 *
 * @param {ol.style.Fill} fill Fill style.
 * @api
 */
_ol_style_Text_.prototype.setFill = function(fill) {
  this.fill_ = fill;
};


/**
 * Set the rotation.
 *
 * @param {number|undefined} rotation Rotation.
 * @api
 */
_ol_style_Text_.prototype.setRotation = function(rotation) {
  this.rotation_ = rotation;
};


/**
 * Set the scale.
 *
 * @param {number|undefined} scale Scale.
 * @api
 */
_ol_style_Text_.prototype.setScale = function(scale) {
  this.scale_ = scale;
};


/**
 * Set the stroke.
 *
 * @param {ol.style.Stroke} stroke Stroke style.
 * @api
 */
_ol_style_Text_.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
};


/**
 * Set the text.
 *
 * @param {string|undefined} text Text.
 * @api
 */
_ol_style_Text_.prototype.setText = function(text) {
  this.text_ = text;
};


/**
 * Set the text alignment.
 *
 * @param {string|undefined} textAlign Text align.
 * @api
 */
_ol_style_Text_.prototype.setTextAlign = function(textAlign) {
  this.textAlign_ = textAlign;
};


/**
 * Set the text baseline.
 *
 * @param {string|undefined} textBaseline Text baseline.
 * @api
 */
_ol_style_Text_.prototype.setTextBaseline = function(textBaseline) {
  this.textBaseline_ = textBaseline;
};
export default _ol_style_Text_;
