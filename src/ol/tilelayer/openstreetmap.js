goog.provide('ol.tilelayer.createOpenStreetMap');

goog.require('ol.Layer');
goog.require('ol.TileLayer');
goog.require('ol.tilestore.createOpenStreetMap');


/**
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.tilelayer.createOpenStreetMap = function(opt_values) {
  var store = ol.tilestore.createOpenStreetMap();
  return new ol.TileLayer(store, opt_values);
};
