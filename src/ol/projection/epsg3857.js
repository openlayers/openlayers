goog.provide('ol.projection.EPSG3857');

goog.require('goog.array');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 */
ol.projection.EPSG3857 = function(code) {
  goog.base(
      this, code, ol.ProjectionUnits.METERS, ol.projection.EPSG3857.EXTENT);
};
goog.inherits(ol.projection.EPSG3857, ol.Projection);


/**
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.RADIUS = 6378137;


/**
 * @const
 * @type {number}
 */
ol.projection.EPSG3857.HALF_SIZE = Math.PI * ol.projection.EPSG3857.RADIUS;


/**
 * @const
 * @type {ol.Extent}
 */
ol.projection.EPSG3857.EXTENT = new ol.Extent(
    -ol.projection.EPSG3857.HALF_SIZE, -ol.projection.EPSG3857.HALF_SIZE,
    ol.projection.EPSG3857.HALF_SIZE, ol.projection.EPSG3857.HALF_SIZE);


/**
 * Lists several projection codes with the same meaning as EPSG:3857.
 *
 * @type {Array.<string>}
 */
ol.projection.EPSG3857.CODES = [
  'EPSG:3857',
  'EPSG:102100',
  'EPSG:102113',
  'EPSG:900913'
];


/**
 * Projections equal to EPSG:3857.
 *
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.projection.EPSG3857.PROJECTIONS = goog.array.map(
    ol.projection.EPSG3857.CODES,
    function(code) {
      return new ol.projection.EPSG3857(code);
    });


/**
 * Transformation from EPSG:4326 to EPSG:3857.
 *
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.projection.EPSG3857.fromEPSG4326 = function(point) {
  var x = ol.projection.EPSG3857.RADIUS * Math.PI * point.x / 180;
  var y = ol.projection.EPSG3857.RADIUS *
      Math.log(Math.tan(Math.PI * (point.y + 90) / 360));
  return new ol.Coordinate(x, y);
};


/**
 * Transformation from EPSG:3857 to EPSG:4326.
 *
 * @param {ol.Coordinate} point Point.
 * @return {ol.Coordinate} Point.
 */
ol.projection.EPSG3857.toEPSG4326 = function(point) {
  var x = 180 * point.x / (ol.projection.EPSG3857.RADIUS * Math.PI);
  var y = 360 * Math.atan(
      Math.exp(point.y / ol.projection.EPSG3857.RADIUS)) / Math.PI - 90;
  return new ol.Coordinate(x, y);
};
