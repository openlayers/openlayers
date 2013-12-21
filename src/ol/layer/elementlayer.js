goog.provide('ol.layer.Element');

goog.require('ol.layer.Layer');



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {olx.layer.LayerOptions} options Options.
 */
ol.layer.Element = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Element, ol.layer.Layer);
