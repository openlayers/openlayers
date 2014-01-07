goog.provide('ol.style.Fill');

goog.require('goog.asserts');


/**
 * @typedef {ol.Color|ol.style.Fill|olx.style.FillOptions|string|undefined}
 */
ol.style.FillLike;



/**
 * @constructor
 * @param {olx.style.FillOptions=} opt_options Options.
 */
ol.style.Fill = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.color_ = goog.isDef(options.color) ? options.color : null;
};


/**
 * @return {ol.Color|string} Color.
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * @param {ol.style.FillLike} fillLike Fill like.
 * @return {ol.style.Fill} Fill style.
 */
ol.style.Fill.get = function(fillLike) {
  if (!goog.isDefAndNotNull(fillLike)) {
    return null;
  } else if (fillLike instanceof ol.style.Fill) {
    return fillLike;
  } else if (goog.isArray(fillLike) || goog.isString(fillLike)) {
    return new ol.style.Fill({
      color: fillLike
    });
  } else if (goog.isObject(fillLike)) {
    return new ol.style.Fill(fillLike);
  } else {
    goog.asserts.fail();
    return new ol.style.Fill();
  }
};
