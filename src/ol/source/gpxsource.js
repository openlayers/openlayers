goog.provide('ol.source.GPX');

goog.require('ol.format.GPX');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.GPXOptions=} opt_options Options.
 * @todo api
 */
ol.source.GPX = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    doc: options.doc,
    extent: options.extent,
    format: new ol.format.GPX(),
    logo: options.logo,
    node: options.node,
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.GPX, ol.source.StaticVector);
