goog.provide('ol.source.OSM');

goog.require('ol.Attribution');
goog.require('ol.source.XYZ');



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.OSMOptions=} opt_options Open Street Map options.
 * @todo stability experimental
 */
ol.source.OSM = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var attributions;
  if (goog.isDef(options.attributions)) {
    attributions = options.attributions;
  } else {
    attributions = ol.source.OSM.ATTRIBUTIONS;
  }

  var url = goog.isDef(options.url) ?
      options.url : 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  goog.base(this, {
    attributions: attributions,
    crossOrigin: 'anonymous',
    opaque: true,
    maxZoom: options.maxZoom,
    tileLoadFunction: options.tileLoadFunction,
    url: url
  });

};
goog.inherits(ol.source.OSM, ol.source.XYZ);


/**
 * @const
 * @type {ol.Attribution}
 */
ol.source.OSM.DATA_ATTRIBUTION = new ol.Attribution({
  html: 'Data &copy; ' +
      '<a href="http://www.openstreetmap.org/">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
});


/**
 * @const
 * @type {ol.Attribution}
 */
ol.source.OSM.TILE_ATTRIBUTION = new ol.Attribution({
  html: 'Tiles &copy; ' +
      '<a href="http://www.openstreetmap.org/">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>'
});


/**
 * @const
 * @type {Array.<ol.Attribution>}
 */
ol.source.OSM.ATTRIBUTIONS = [
  ol.source.OSM.TILE_ATTRIBUTION,
  ol.source.OSM.DATA_ATTRIBUTION
];
