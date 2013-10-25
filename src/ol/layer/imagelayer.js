goog.provide('ol.layer.Image');

goog.require('ol.layer.Layer');
goog.require('ol.source.Image');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} options Layer options.
 * @todo stability experimental
 */
ol.layer.Image = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Image, ol.layer.Layer);


/**
 * @return {ol.source.Image} Single image source.
 */
ol.layer.Image.prototype.getImageSource = function() {
  return /** @type {ol.source.Image} */ (this.getSource());
};
