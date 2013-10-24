goog.provide('ol.layer.Vector2');

goog.require('ol.layer.Layer');
goog.require('ol.source.Vector2');



/**
 * This is an internal class that will be removed from the API.
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} options Options.
 * @todo stability experimental
 */
ol.layer.Vector2 = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Vector2, ol.layer.Layer);


/**
 * @return {ol.source.Vector2} Source.
 */
ol.layer.Vector2.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector2} */ (this.getSource());
};
