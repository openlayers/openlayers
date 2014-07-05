goog.provide('ol.layer.Image');

goog.require('ol.layer.Layer');



/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.LayerOptions} options Layer options.
 * @api
 */
ol.layer.Image = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Image, ol.layer.Layer);
