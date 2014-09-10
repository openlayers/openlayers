goog.provide('ol.source.OSMXML');

goog.require('ol.format.OSMXML');
goog.require('ol.source.StaticVector');



/**
 * @classdesc
 * Static vector source in OSMXML format
 *
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires ol.source.VectorEvent
 * @param {olx.source.OSMXMLOptions=} opt_options Options.
 * @api
 */
ol.source.OSMXML = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    doc: options.doc,
    format: new ol.format.OSMXML(),
    logo: options.logo,
    node: options.node,
    projection: options.projection,
    reprojectTo: options.reprojectTo,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.OSMXML, ol.source.StaticVector);
