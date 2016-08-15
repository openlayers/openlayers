goog.provide('ol.layer.Image');

goog.require('ol');
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
 * @param {olx.layer.ImageOptions=} opt_options Layer options.
 * @api stable
 */
ol.layer.Image = function(opt_options) {
  var options = opt_options ? opt_options : {};
  ol.layer.Layer.call(this,  /** @type {olx.layer.LayerOptions} */ (options));
};
ol.inherits(ol.layer.Image, ol.layer.Layer);


/**
 * Return the associated {@link ol.source.Image source} of the image layer.
 * @function
 * @return {ol.source.Image} Source.
 * @api stable
 */
ol.layer.Image.prototype.getSource;
