goog.provide('ol.style.Text');

goog.require('goog.asserts');



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

  /**
   * @private
   * @type {boolean}
   */
  this.mutable_ = true;

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
 */
ol.style.Text.prototype.getOffsetX = function() {
  return this.offsetX_;
};


/**
 * @return {number} Vertical text offset.
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
 * @param {string|undefined} font Font.
 * @api
 */
ol.style.Text.prototype.setFont = function(font) {
  goog.asserts.assert(this.mutable_);
  this.font_ = font;
};


/**
 * @param {number} offsetX Horizontal text offset.
 */
ol.style.Text.prototype.setOffsetX = function(offsetX) {
  goog.asserts.assert(this.mutable_);
  this.offsetX_ = offsetX;
};


/**
 * @param {number} offsetY Vertical text offset.
 */
ol.style.Text.prototype.setOffsetY = function(offsetY) {
  goog.asserts.assert(this.mutable_);
  this.offsetY_ = offsetY;
};


/**
 * @param {ol.style.Fill} fill Fill style.
 * @api
 */
ol.style.Text.prototype.setFill = function(fill) {
  goog.asserts.assert(this.mutable_);
  this.fill_ = fill;
};


/**
 * @param {number|undefined} rotation Rotation.
 * @api
 */
ol.style.Text.prototype.setRotation = function(rotation) {
  goog.asserts.assert(this.mutable_);
  this.rotation_ = rotation;
};


/**
 * @param {number|undefined} scale Scale.
 * @api
 */
ol.style.Text.prototype.setScale = function(scale) {
  goog.asserts.assert(this.mutable_);
  this.scale_ = scale;
};


/**
 * @param {ol.style.Stroke} stroke Stroke style.
 * @api
 */
ol.style.Text.prototype.setStroke = function(stroke) {
  goog.asserts.assert(this.mutable_);
  this.stroke_ = stroke;
};


/**
 * @param {string|undefined} text Text.
 * @api
 */
ol.style.Text.prototype.setText = function(text) {
  goog.asserts.assert(this.mutable_);
  this.text_ = text;
};


/**
 * @param {string|undefined} textAlign Text align.
 * @api
 */
ol.style.Text.prototype.setTextAlign = function(textAlign) {
  goog.asserts.assert(this.mutable_);
  this.textAlign_ = textAlign;
};


/**
 * @param {string|undefined} textBaseline Text baseline.
 * @api
 */
ol.style.Text.prototype.setTextBaseline = function(textBaseline) {
  goog.asserts.assert(this.mutable_);
  this.textBaseline_ = textBaseline;
};


/**
 * @param {boolean} mutable Mutable.
 */
ol.style.Text.prototype.setMutable = function(mutable) {
  if (!goog.isNull(this.stroke_)) {
    this.stroke_.setMutable(mutable);
  }
  if (!goog.isNull(this.fill_)) {
    this.fill_.setMutable(mutable);
  }
  this.mutable_ = mutable;
};
