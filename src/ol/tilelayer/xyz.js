goog.provide('ol.tilelayer.createXYZ');

goog.require('ol.Layer');
goog.require('ol.TileLayer');
goog.require('ol.tilestore.createXYZ');


/**
 * @param {number} maxZoom Maximum zoom.
 * @param {Array.<string>} templates Templates.
 * @param {string=} opt_attribution Attribution.
 * @param {string=} opt_crossOrigin Cross origin.
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.tilelayer.createXYZ =
    function(maxZoom, templates, opt_attribution, opt_crossOrigin, opt_values) {
  var store = ol.tilestore.createXYZ(
      maxZoom, templates, opt_attribution, opt_crossOrigin);
  return new ol.TileLayer(store, opt_values);
};
