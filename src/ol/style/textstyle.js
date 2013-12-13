goog.provide('ol.style.Text');



/**
 * @constructor
 * @param {olx.style.TextOptions} options Options.
 */
ol.style.Text = function(options) {

  /**
   * @type {string|undefined}
   */
  this.font = options.font;

  /**
   * @type {number|undefined}
   */
  this.rotation = options.rotation;

  /**
   * @type {string|undefined}
   */
  this.text = options.text;

  /**
   * @type {string|undefined}
   */
  this.textAlign = options.textAlign;

  /**
   * @type {string|undefined}
   */
  this.textBaseline = options.textBaseline;

  /**
   * @type {ol.style.Fill}
   */
  this.fill = goog.isDef(options.fill) ? options.fill : null;

  /**
   * @type {ol.style.Stroke}
   */
  this.stroke = goog.isDef(options.stroke) ? options.stroke : null;
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
          textStyle1.font == textStyle2.font &&
          textStyle1.text == textStyle2.text &&
          textStyle1.textAlign == textStyle2.textAlign &&
          textStyle1.textBaseline == textStyle2.textBaseline);
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
