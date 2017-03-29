goog.provide('ol.source.DhivehiMaps');

goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.source.XYZ');

ol.source.DhivehiMaps = function(opt_options) {

  var options = opt_options || {};

  var attributions;
  if (options.attributions !== undefined) {
    attributions = options.attributions;
  } else {
    attributions = [ol.source.DhivehiMaps.ATTRIBUTION];
  }

  var crossOrigin = options.crossOrigin !== undefined ?
      options.crossOrigin : 'anonymous';

  var url = options.url !== undefined ?
      options.url : 'https://dhivehi.mv/maps/server/live/?x={x}&y={y}&z={z}';

  ol.source.XYZ.call(this, {
    attributions: attributions,
    crossOrigin: crossOrigin,
    maxZoom: options.maxZoom !== undefined ? options.maxZoom : 25,
    tileLoadFunction: options.tileLoadFunction,
    url: url,
    wrapX: options.wrapX
  });

};
ol.inherits(ol.source.DhivehiMaps, ol.source.XYZ);


/**
 * The attribution containing a link to the DhivehiMaps
 * page.
 * @const
 * @type {ol.Attribution}
 * @api
 */
ol.source.DhivehiMaps.ATTRIBUTION = new ol.Attribution({
  html: '<a href="https://dhivehi.mv/maps/">Dhivehi Maps</a>'
});
