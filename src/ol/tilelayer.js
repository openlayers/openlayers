goog.provide('ol.TileLayer');

goog.require('ol.Layer');
goog.require('ol.TileStore');


/**
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.TileLayer.createOpenStreetMap = function(opt_values) {
  var store = ol.TileStore.createOpenStreetMap();
  return new ol.Layer(store, opt_values);
};
