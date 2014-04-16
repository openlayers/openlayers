goog.provide('ol.source.KML');

goog.require('ol.format.KML');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.KMLOptions=} opt_options Options.
 * @todo api
 */
ol.source.KML = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    doc: options.doc,
    extent: options.extent,
    format: new ol.format.KML({
      defaultStyle: options.defaultStyle
    }),
    logo: options.logo,
    node: options.node,
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.KML, ol.source.StaticVector);
