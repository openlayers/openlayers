goog.provide('ol.layer.ImageLayer');

goog.require('ol.layer.Layer');
goog.require('ol.source.ImageSource');



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
 * @return {ol.source.ImageSource} Single image source.
 */
ol.layer.ImageLayer.prototype.getImageSource = function() {
  return /** @type {ol.source.ImageSource} */ (this.getSource());
};
