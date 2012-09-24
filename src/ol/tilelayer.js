goog.provide('ol.TileLayer');

goog.require('ol.layer.Layer');
goog.require('ol.TileStore');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.TileStore} tileStore Tile store.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.TileLayer = function(tileStore, opt_values) {
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.TileLayer, ol.layer.Layer);


/**
 * @inheritDoc
 * @return {ol.TileStore} Store.
 */
ol.TileLayer.prototype.getStore = function() {
  return /** @type {ol.TileStore} */ goog.base(this, 'getStore');
};
