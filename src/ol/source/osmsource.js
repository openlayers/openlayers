goog.provide('ol.source.OSM');

goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.source.XYZ');



/**
 * @classdesc
 * Layer source for the OpenStreetMap tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.OSMOptions=} opt_options Open Street Map options.
 * @api stable
 */
ol.source.OSM = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var attributions;
  if (goog.isDef(options.attributions)) {
    attributions = options.attributions;
  } else {
    attributions = [ol.source.OSM.ATTRIBUTION];
  }

  var crossOrigin = goog.isDef(options.crossOrigin) ?
      options.crossOrigin : 'anonymous';

  var protocol = ol.IS_HTTPS ? 'https:' : 'http:';
  var url = goog.isDef(options.url) ?
      options.url : protocol + '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  goog.base(this, {
    attributions: attributions,
    crossOrigin: crossOrigin,
    opaque: true,
    maxZoom: goog.isDef(options.maxZoom) ? options.maxZoom : 19,
    tileLoadFunction: options.tileLoadFunction,
    url: url,
    wrapX: options.wrapX
  });

};
goog.inherits(ol.source.OSM, ol.source.XYZ);


/**
 * @const
 * @type {ol.Attribution}
 * @api
 */
ol.source.OSM.ATTRIBUTION = new ol.Attribution({
  html: '&copy; ' +
      '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      'contributors.'
});
