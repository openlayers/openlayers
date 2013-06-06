goog.provide('ol.layer.VectorLayer2');

goog.require('ol.layer.Layer');
goog.require('ol.source.VectorSource2');



/**
 * This is an internal class that will be removed from the API.
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} options Options.
 */
ol.layer.VectorLayer2 = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.VectorLayer2, ol.layer.Layer);


/**
 * @return {ol.source.VectorSource2} Source.
 */
ol.layer.VectorLayer2.prototype.getVectorSource = function() {
  return /** @type {ol.source.VectorSource2} */ (this.getSource());
};
