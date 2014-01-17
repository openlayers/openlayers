goog.provide('ol.source.TopoJSON');

goog.require('ol.format.TopoJSON');
goog.require('ol.source.VectorFile');



/**
 * @constructor
 * @extends {ol.source.VectorFile}
 * @param {olx.source.TopoJSONOptions=} opt_options Options.
 */
ol.source.TopoJSON = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    format: new ol.format.TopoJSON({
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
goog.inherits(ol.source.TopoJSON, ol.source.VectorFile);
