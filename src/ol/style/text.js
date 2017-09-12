goog.provide('ol.style.Text');


goog.require('ol.style.Fill');
goog.require('ol.style.TextPlacement');


/**
 * @classdesc
 * Set text style for vector features.
 *
 * @constructor
 * @param {olx.style.TextOptions=} opt_options Options.
 * @api
 */
ol.style.Text = function(opt_options) {

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
    new ol.style.Fill({color: ol.style.Text.DEFAULT_FILL_COLOR_});

  /**
   * @private
   * @type {number}
   */
  this.maxAngle_ = options.maxAngle !== undefined ? options.maxAngle : Math.PI / 4;

  /**
   * @private
   * @type {ol.style.TextPlacement|string}
   */
  this.placement_ = options.placement !== undefined ? options.placement : ol.style.TextPlacement.POINT;

  /**
   * @private
   * @type {boolean}
   */
  this.exceedLength_ = options.exceedLength !== undefined ? options.exceedLength : false;

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
ol.style.Text.DEFAULT_FILL_COLOR_ = '#333';


/**
 * Clones the style.
 * @return {ol.style.Text} The cloned style.
 * @api
 */
ol.style.Text.prototype.clone = function() {
  return new ol.style.Text({
    font: this.getFont(),
    placement: this.getPlacement(),
    maxAngle: this.getMaxAngle(),
    exceedLength: this.getExceedLength(),
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
 * Get the `exceedLength` configuration.
 * @return {boolean} Let text exceed the length of the path they follow.
 * @api
 */
ol.style.Text.prototype.getExceedLength = function() {
  return this.exceedLength_;
};


/**
 * Get the font name.
 * @return {string|undefined} Font.
 * @api
 */
ol.style.Text.prototype.getFont = function() {
  return this.font_;
};


/**
 * Get the maximum angle between adjacent characters.
 * @return {number} Angle in radians.
 * @api
 */
ol.style.Text.prototype.getMaxAngle = function() {
  return this.maxAngle_;
};


/**
 * Get the label placement.
 * @return {ol.style.TextPlacement|string} Text placement.
 * @api
 */
ol.style.Text.prototype.getPlacement = function() {
  return this.placement_;
};


/**
 * Get the x-offset for the text.
 * @return {number} Horizontal text offset.
 * @api
 */
ol.style.Text.prototype.getOffsetX = function() {
  return this.offsetX_;
};


/**
 * Get the y-offset for the text.
 * @return {number} Vertical text offset.
 * @api
 */
ol.style.Text.prototype.getOffsetY = function() {
  return this.offsetY_;
};


/**
 * Get the fill style for the text.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Text.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Determine whether the text rotates with the map.
 * @return {boolean|undefined} Rotate with map.
 * @api
 */
ol.style.Text.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * Get the text rotation.
 * @return {number|undefined} Rotation.
 * @api
 */
ol.style.Text.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the text scale.
 * @return {number|undefined} Scale.
 * @api
 */
ol.style.Text.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Get the stroke style for the text.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Text.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Get the text to be rendered.
 * @return {string|undefined} Text.
 * @api
 */
ol.style.Text.prototype.getText = function() {
  return this.text_;
};


/**
 * Get the text alignment.
 * @return {string|undefined} Text align.
 * @api
 */
ol.style.Text.prototype.getTextAlign = function() {
  return this.textAlign_;
};


/**
 * Get the text baseline.
 * @return {string|undefined} Text baseline.
 * @api
 */
ol.style.Text.prototype.getTextBaseline = function() {
  return this.textBaseline_;
};


/**
 * Set the `exceedLength` property.
 *
 * @param {boolean} exceedLength Let text exceed the path that it follows.
 * @api
 */
ol.style.Text.prototype.setExceedLength = function(exceedLength) {
  this.exceedLength_ = exceedLength;
};


/**
 * Set the font.
 *
 * @param {string|undefined} font Font.
 * @api
 */
ol.style.Text.prototype.setFont = function(font) {
  this.font_ = font;
};


/**
 * Set the maximum angle between adjacent characters.
 *
 * @param {number} maxAngle Angle in radians.
 * @api
 */
ol.style.Text.prototype.setMaxAngle = function(maxAngle) {
  this.maxAngle_ = maxAngle;
};


/**
 * Set the x offset.
 *
 * @param {number} offsetX Horizontal text offset.
 * @api
 */
ol.style.Text.prototype.setOffsetX = function(offsetX) {
  this.offsetX_ = offsetX;
};


/**
 * Set the y offset.
 *
 * @param {number} offsetY Vertical text offset.
 * @api
 */
ol.style.Text.prototype.setOffsetY = function(offsetY) {
  this.offsetY_ = offsetY;
};


/**
 * Set the text placement.
 *
 * @param {ol.style.TextPlacement|string} placement Placement.
 * @api
 */
ol.style.Text.prototype.setPlacement = function(placement) {
  this.placement_ = placement;
};


/**
 * Set the fill.
 *
 * @param {ol.style.Fill} fill Fill style.
 * @api
 */
ol.style.Text.prototype.setFill = function(fill) {
  this.fill_ = fill;
};


/**
 * Set the rotation.
 *
 * @param {number|undefined} rotation Rotation.
 * @api
 */
ol.style.Text.prototype.setRotation = function(rotation) {
  this.rotation_ = rotation;
};


/**
 * Set the scale.
 *
 * @param {number|undefined} scale Scale.
 * @api
 */
ol.style.Text.prototype.setScale = function(scale) {
  this.scale_ = scale;
};


/**
 * Set the stroke.
 *
 * @param {ol.style.Stroke} stroke Stroke style.
 * @api
 */
ol.style.Text.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
};


/**
 * Set the text.
 *
 * @param {string|undefined} text Text.
 * @api
 */
ol.style.Text.prototype.setText = function(text) {
  this.text_ = text;
};


/**
 * Set the text alignment.
 *
 * @param {string|undefined} textAlign Text align.
 * @api
 */
ol.style.Text.prototype.setTextAlign = function(textAlign) {
  this.textAlign_ = textAlign;
};


/**
 * Set the text baseline.
 *
 * @param {string|undefined} textBaseline Text baseline.
 * @api
 */
ol.style.Text.prototype.setTextBaseline = function(textBaseline) {
  this.textBaseline_ = textBaseline;
};
