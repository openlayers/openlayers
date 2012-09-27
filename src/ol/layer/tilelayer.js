goog.provide('ol.layer.TileLayer');

goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerOptions');
goog.require('ol.source.TileSource');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} layerOptions Layer options.
 */
ol.layer.TileLayer = function(layerOptions) {
  goog.base(this, layerOptions);
};
goog.inherits(ol.layer.TileLayer, ol.layer.Layer);


/**
 * @return {ol.source.TileSource} Source.
 */
ol.layer.TileLayer.prototype.getTileSource = function() {
  return /** @type {ol.source.TileSource} */ this.getSource();
};
