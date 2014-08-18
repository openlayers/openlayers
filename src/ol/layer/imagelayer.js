goog.provide('ol.layer.Image');

goog.require('ol.layer.Layer');



/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link ol.Object}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @constructor
 * @extends {ol.layer.Layer}
 * @fires ol.render.Event
 * @param {olx.layer.LayerOptions} options Layer options.
 * @api stable
 */
ol.layer.Image = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.layer.Image, ol.layer.Layer);
