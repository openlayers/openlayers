goog.provide('ol.layer.VectorLayer2');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector2');



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
 * @return {ol.source.Vector2} Source.
 */
ol.layer.VectorLayer2.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector2} */ (this.getSource());
};
