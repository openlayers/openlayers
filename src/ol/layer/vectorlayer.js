goog.provide('ol.layer.VectorLayer');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} layerOptions Layer options.
 */
ol.layer.VectorLayer = function(layerOptions) {
  goog.base(this, layerOptions);
};
goog.inherits(ol.layer.VectorLayer, ol.layer.Layer);


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.VectorLayer.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};
