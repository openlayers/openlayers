goog.provide('ol.layer.Image');

goog.require('ol.layer.Layer');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires {@link ol.render.Event} ol.render.Event
 * @param {olx.layer.LayerOptions} options Layer options.
 * @todo api
 */
ol.layer.Image = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Image, ol.layer.Layer);
