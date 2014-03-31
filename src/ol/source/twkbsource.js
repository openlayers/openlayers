goog.provide('ol.source.TWKB');

goog.require('ol.format.TWKB');
goog.require('ol.source.VectorFile');



/**
 * @constructor
 * @extends {ol.source.VectorFile}
 * @param {olx.source.TWKBOptions=} opt_options Options.
 */
ol.source.TWKB = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    arrayBuffer: options.arrayBuffer,
    extent: options.extent,
    format: new ol.format.TWKB({
      defaultProjection: options.defaultProjection
    }),
    logo: options.logo,
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.TWKB, ol.source.VectorFile);
