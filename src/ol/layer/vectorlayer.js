goog.provide('ol.layer.Vector');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} layerOptions Layer options.
 */
ol.layer.Vector = function(layerOptions) {
  goog.base(this, layerOptions);
};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};
