goog.provide('ol.TileLayer');

goog.require('ol.Layer');
goog.require('ol.TileStore');



/**
 * @constructor
 * @extends {ol.Layer}
 * @param {ol.TileStore} tileStore Tile store.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.TileLayer = function(tileStore, opt_values) {
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.TileLayer, ol.Layer);


/**
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.TileLayer.createOpenStreetMap = function(opt_values) {
  var store = ol.TileStore.createOpenStreetMap();
  return new ol.TileLayer(store, opt_values);
};
