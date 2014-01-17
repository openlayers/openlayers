goog.provide('ol.source.GPX');

goog.require('ol.format.GPX');
goog.require('ol.source.VectorFile');



/**
 * @constructor
 * @extends {ol.source.VectorFile}
 * @param {olx.source.GPXOptions=} opt_options Options.
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
    reprojectTo: options.reprojectTo,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.GPX, ol.source.VectorFile);
