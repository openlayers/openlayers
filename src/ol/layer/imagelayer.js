goog.provide('ol.layer.Image');

goog.require('ol.layer.Layer');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {olx.layer.LayerOptions} options Layer options.
 * @todo stability experimental
 */
ol.layer.Image = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Image, ol.layer.Layer);
