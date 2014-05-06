goog.provide('ol.source.IGC');

goog.require('ol.format.IGC');
goog.require('ol.source.StaticVector');



/**
 * @constructor
 * @extends {ol.source.StaticVector}
 * @fires {@link ol.source.VectorEvent} ol.source.VectorEvent
 * @param {olx.source.IGCOptions=} opt_options Options.
 * @todo api
 */
ol.source.IGC = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    format: new ol.format.IGC({
      altitudeMode: options.altitudeMode
    }),
    projection: options.projection,
    text: options.text,
    url: options.url,
    urls: options.urls
  });

};
goog.inherits(ol.source.IGC, ol.source.StaticVector);
