goog.provide('ol3.TileLayer');

goog.require('ol3.Layer');
goog.require('ol3.TileStore');



/**
 * @constructor
 * @extends {ol3.Layer}
 * @param {ol3.TileStore} tileStore Tile store.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.TileLayer = function(tileStore, opt_values) {
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol3.TileLayer, ol3.Layer);


/**
 * @inheritDoc
 * @return {ol3.TileStore} Store.
 */
ol3.TileLayer.prototype.getStore = function() {
  return /** @type {ol3.TileStore} */ goog.base(this, 'getStore');
};
