goog.provide('ol.style.Stroke');

goog.require('ol.color');


/**
 * @typedef {{color: (ol.Color|string),
 *            width: number}}
 */
ol.style.StrokeOptions;



/**
 * @constructor
 * @param {ol.style.StrokeOptions} options Options.
 */
ol.style.Stroke = function(options) {

  /**
   * @type {ol.Color|string}
   */
  this.color = options.color;

  /**
   * @type {number}
   */
  this.width = options.width;
};


/**
 * @param {ol.style.Stroke} strokeStyle1 Stroke style 1.
 * @param {ol.style.Stroke} strokeStyle2 Stroke style 2.
 * @return {boolean} Equals.
 */
ol.style.Stroke.equals = function(strokeStyle1, strokeStyle2) {
  if (!goog.isNull(strokeStyle1)) {
    if (!goog.isNull(strokeStyle2)) {
      return strokeStyle1 === strokeStyle2 ||
          (ol.color.stringOrColorEquals(strokeStyle1.color,
                                        strokeStyle2.color) &&
           strokeStyle1.width == strokeStyle2.width);
    } else {
      return false;
    }
  } else {
    if (!goog.isNull(strokeStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};
