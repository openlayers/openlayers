goog.provide('ol.layer.ImageLayer');

goog.require('ol.layer.Layer');
goog.require('ol.source.Image');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} options Layer options.
 */
ol.layer.ImageLayer = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.ImageLayer, ol.layer.Layer);


/**
 * @return {ol.source.Image} Single image source.
 */
ol.layer.ImageLayer.prototype.getImageSource = function() {
  return /** @type {ol.source.Image} */ (this.getSource());
};
