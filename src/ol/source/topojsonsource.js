goog.provide('ol.source.TopoJSON');

goog.require('ol.format.TopoJSON');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.TopoJSONOptions=} opt_options Options.
 * @todo api
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
    text: options.text,
    url: options.url
  });

};
goog.inherits(ol.source.TopoJSON, ol.source.StaticVector);
