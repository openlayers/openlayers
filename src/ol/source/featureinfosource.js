goog.provide('ol.source.FeatureInfoSource');



/**
 * @interface
 */
ol.source.FeatureInfoSource = function() {};


/**
 * @param {ol.Pixel} pixel Pixel.
 * @param {ol.Map} map The map that the pixel belongs to.
 * @param {function(string)} success Callback with feature info.
 * @param {function()=} opt_error Optional error callback.
 */
ol.source.FeatureInfoSource.prototype.getFeatureInfoForPixel =
    goog.abstractMethod;
