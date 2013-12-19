goog.provide('ol.style.Text');



/**
 * @constructor
 * @param {olx.style.TextOptions=} opt_options Options.
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
};


/**
 * @param {ol.style.Text} textStyle1 Text style 1.
 * @param {ol.style.Text} textStyle2 Text style 2.
 * @return {boolean} Equals.
 */
ol.style.Text.equals = function(textStyle1, textStyle2) {
  if (!goog.isNull(textStyle1)) {
    if (!goog.isNull(textStyle2)) {
      return textStyle1 === textStyle2 || (
          textStyle1.getFont() == textStyle2.getFont() &&
          textStyle1.getText() == textStyle2.getText() &&
          textStyle1.getTextAlign() == textStyle2.getTextAlign() &&
          textStyle1.getTextBaseline() == textStyle2.getTextBaseline());
    } else {
      return false;
    }
  } else {
    if (!goog.isNull(textStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};


/**
 * @return {string|undefined} Font.
 */
ol.style.Text.prototype.getFont = function() {
  return this.font_;
};


/**
 * @return {ol.style.Fill} Fill style.
 */
ol.style.Text.prototype.getFill = function() {
  return this.fill_;
};


/**
 * @return {number|undefined} Rotation.
 */
ol.style.Text.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * @return {ol.style.Stroke} Stroke style.
 */
ol.style.Text.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * @return {string|undefined} Text.
 */
ol.style.Text.prototype.getText = function() {
  return this.text_;
};


/**
 * @return {string|undefined} Text align.
 */
ol.style.Text.prototype.getTextAlign = function() {
  return this.textAlign_;
};


/**
 * @return {string|undefined} Text baseline.
 */
ol.style.Text.prototype.getTextBaseline = function() {
  return this.textBaseline_;
};
