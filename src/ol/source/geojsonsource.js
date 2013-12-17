goog.provide('ol.source.GeoJSON');

goog.require('ol.format.GeoJSON');
goog.require('ol.source.VectorFile');



/**
 * @constructor
 * @extends {ol.source.VectorFile}
 * @param {olx.source.GeoJSONOptions=} opt_options Options.
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
    reprojectTo: options.reprojectTo,
    text: options.text,
    url: options.url
  });

};
goog.inherits(ol.source.GeoJSON, ol.source.VectorFile);
