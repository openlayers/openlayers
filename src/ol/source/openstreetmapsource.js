goog.provide('ol.source.OpenStreetMap');

goog.require('ol.Attribution');
goog.require('ol.source.XYZ');


/**
 * @const
 * @type {Array.<ol.Attribution>}
 */
ol.source.OPENSTREETMAP_ATTRIBUTIONS = [new ol.Attribution(
    '&copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
    'contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>')];



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.OpenStreetMapOptions=} opt_options Open Street Map options.
 */
ol.source.OpenStreetMap = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var attributions;
  if (goog.isDef(options.attributions)) {
    attributions = options.attributions;
  } else if (goog.isDef(options.attribution)) {
    attributions = [options.attribution];
  } else {
    attributions = ol.source.OPENSTREETMAP_ATTRIBUTIONS;
  }

  var maxZoom = goog.isDef(options.maxZoom) ? options.maxZoom : 18;

  var url = goog.isDef(options.url) ?
      options.url : 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    opaque: true,
    maxZoom: maxZoom,
    url: url
  });

};
goog.inherits(ol.source.OpenStreetMap, ol.source.XYZ);
