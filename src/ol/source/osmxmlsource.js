goog.provide('ol.source.OSMXML');

goog.require('ol.format.OSMXML');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.OSMXMLOptions=} opt_options Options.
 * @todo api
 */
ol.source.OSMXML = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    doc: options.doc,
    extent: options.extent,
    format: new ol.format.OSMXML(),
    logo: options.logo,
    node: options.node,
    projection: options.projection,
    reprojectTo: options.reprojectTo,
    text: options.text,
    url: options.url
  });

};
goog.inherits(ol.source.OSMXML, ol.source.StaticVector);
