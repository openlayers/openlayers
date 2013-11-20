goog.provide('ol.style.Fill');

goog.require('ol.color');


/**
 * @typedef {{color: (ol.Color|string)}}
 */
ol.style.FillOptions;



/**
 * @constructor
 * @param {ol.style.FillOptions} options Options.
 */
ol.style.Fill = function(options) {

  /**
   * @type {ol.Color|string}
   */
  this.color = options.color;
};


/**
 * @param {ol.style.Fill} fillStyle1 Fill style 1.
 * @param {ol.style.Fill} fillStyle2 Fill style 2.
 * @return {boolean} Equals.
 */
ol.style.Fill.equals = function(fillStyle1, fillStyle2) {
  if (!goog.isNull(fillStyle1)) {
    if (!goog.isNull(fillStyle2)) {
      return fillStyle1 === fillStyle2 ||
          ol.color.stringOrColorEquals(fillStyle1.color, fillStyle2.color);
    } else {
      return false;
    }
  } else {
    if (!goog.isNull(fillStyle2)) {
      return false;
    } else {
      return true;
    }
  }
};
