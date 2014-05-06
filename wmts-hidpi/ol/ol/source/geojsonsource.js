goog.provide('ol.source.GeoJSON');

goog.require('ol.format.GeoJSON');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.GeoJSONOptions=} opt_options Options.
 * @todo api
 */
ol.source.GeoJSON = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    format: new ol.format.GeoJSON({
      defaultProjection: options.defaultProjection
    }),
    logo: options.logo,
    object: options.object,
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.GeoJSON, ol.source.StaticVector);
