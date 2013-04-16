goog.provide('ol.projection.EPSG4326');

goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.projection');



/**
 * @constructor
 * @extends {ol.Projection}
 * @param {string} code Code.
 * @param {string=} opt_axisOrientation Axis orientation.
 */
ol.projection.EPSG4326 = function(code, opt_axisOrientation) {
  goog.base(this, {
    code: code,
    units: ol.ProjectionUnits.DEGREES,
    extent: ol.projection.EPSG4326.EXTENT,
    axisOrientation: opt_axisOrientation,
    global: true
  });
};
goog.inherits(ol.projection.EPSG4326, ol.Projection);


/**
 * Extent of the EPSG:4326 projection which is the whole world.
 *
 * @const
 * @type {ol.Extent}
 */
ol.projection.EPSG4326.EXTENT = [-180, 180, -90, 90];


/**
 * Projections equal to EPSG:4326.
 *
 * @const
 * @type {Array.<ol.Projection>}
 */
ol.projection.EPSG4326.PROJECTIONS = [
  new ol.projection.EPSG4326('CRS:84'),
  new ol.projection.EPSG4326('EPSG:4326', 'neu'),
  new ol.projection.EPSG4326('urn:ogc:def:crs:EPSG:6.6:4326', 'neu'),
  new ol.projection.EPSG4326('urn:ogc:def:crs:OGC:1.3:CRS84'),
  new ol.projection.EPSG4326('urn:ogc:def:crs:OGC:2:84')
];


/**
 * @inheritDoc
 */
ol.projection.EPSG4326.prototype.getPointResolution =
    function(resolution, point) {
  return resolution;
};
