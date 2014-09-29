goog.provide('ol.style.Text');



/**
 * @classdesc
 * Set text style for vector features.
 *
 * @constructor
 * @param {olx.style.TextOptions=} opt_options Options.
 * @api
 */
ol.style.Text = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

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
  this.fill_ = goog.isDef(options.fill) ? options.fill : null;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = goog.isDef(options.stroke) ? options.stroke : null;

  /**
   * @private
   * @type {number}
   */
  this.offsetX_ = goog.isDef(options.offsetX) ? options.offsetX : 0;

  /**
   * @private
   * @type {number}
   */
  this.offsetY_ = goog.isDef(options.offsetY) ? options.offsetY : 0;
};


/**
 * @return {string|undefined} Font.
 * @api
 */
ol.style.Text.prototype.getFont = function() {
  return this.font_;
};


/**
 * @return {number} Horizontal text offset.
 * @api
 */
ol.style.Text.prototype.getOffsetX = function() {
  return this.offsetX_;
};


/**
 * @return {number} Vertical text offset.
 * @api
 */
ol.style.Text.prototype.getOffsetY = function() {
  return this.offsetY_;
};


/**
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Text.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @return {number|undefined} Rotation.
 * @api
 */
ol.style.Text.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * @return {number|undefined} Scale.
 * @api
 */
ol.style.Text.prototype.getScale = function() {
  return this.scale_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Text.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @return {string|undefined} Text.
 * @api
 */
ol.style.Text.prototype.getText = function() {
  return this.text_;
};


/**
 * @return {string|undefined} Text align.
 * @api
 */
ol.style.Text.prototype.getTextAlign = function() {
  return this.textAlign_;
};


/**
 * @return {string|undefined} Text baseline.
 * @api
 */
ol.style.Text.prototype.getTextBaseline = function() {
  return this.textBaseline_;
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
 * Set the x offset.
 *
 * @param {number} offsetX Horizontal text offset.
 */
ol.style.Text.prototype.setOffsetX = function(offsetX) {
  this.offsetX_ = offsetX;
};


/**
 * Set the y offset.
 *
 * @param {number} offsetY Vertical text offset.
 */
ol.style.Text.prototype.setOffsetY = function(offsetY) {
  this.offsetY_ = offsetY;
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
