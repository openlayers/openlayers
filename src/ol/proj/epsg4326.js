import _ol_ from '../index';
import _ol_proj_Projection_ from '../proj/projection';
import _ol_proj_Units_ from '../proj/units';
var _ol_proj_EPSG4326_ = {};


/**
 * @classdesc
 * Projection object for WGS84 geographic coordinates (EPSG:4326).
 *
 * Note that OpenLayers does not strictly comply with the EPSG definition.
 * The EPSG registry defines 4326 as a CRS for Latitude,Longitude (y,x).
 * OpenLayers treats EPSG:4326 as a pseudo-projection, with x,y coordinates.
 *
 * @constructor
 * @extends {ol.proj.Projection}
 * @param {string} code Code.
 * @param {string=} opt_axisOrientation Axis orientation.
 * @private
 */
_ol_proj_EPSG4326_.Projection_ = function(code, opt_axisOrientation) {
  _ol_proj_Projection_.call(this, {
    code: code,
    units: _ol_proj_Units_.DEGREES,
    extent: _ol_proj_EPSG4326_.EXTENT,
    axisOrientation: opt_axisOrientation,
    global: true,
    metersPerUnit: _ol_proj_EPSG4326_.METERS_PER_UNIT,
    worldExtent: _ol_proj_EPSG4326_.EXTENT
  });
};
_ol_.inherits(_ol_proj_EPSG4326_.Projection_, _ol_proj_Projection_);


/**
 * Radius of WGS84 sphere
 *
 * @const
 * @type {number}
 */
_ol_proj_EPSG4326_.RADIUS = 6378137;


/**
 * Extent of the EPSG:4326 projection which is the whole world.
 *
 * @const
 * @type {ol.Extent}
 */
_ol_proj_EPSG4326_.EXTENT = [-180, -90, 180, 90];


/**
 * @const
 * @type {number}
 */
_ol_proj_EPSG4326_.METERS_PER_UNIT = Math.PI * _ol_proj_EPSG4326_.RADIUS / 180;


/**
 * Projections equal to EPSG:4326.
 *
 * @const
 * @type {Array.<ol.proj.Projection>}
 */
_ol_proj_EPSG4326_.PROJECTIONS = [
  new _ol_proj_EPSG4326_.Projection_('CRS:84'),
  new _ol_proj_EPSG4326_.Projection_('EPSG:4326', 'neu'),
  new _ol_proj_EPSG4326_.Projection_('urn:ogc:def:crs:EPSG::4326', 'neu'),
  new _ol_proj_EPSG4326_.Projection_('urn:ogc:def:crs:EPSG:6.6:4326', 'neu'),
  new _ol_proj_EPSG4326_.Projection_('urn:ogc:def:crs:OGC:1.3:CRS84'),
  new _ol_proj_EPSG4326_.Projection_('urn:ogc:def:crs:OGC:2:84'),
  new _ol_proj_EPSG4326_.Projection_('http://www.opengis.net/gml/srs/epsg.xml#4326', 'neu'),
  new _ol_proj_EPSG4326_.Projection_('urn:x-ogc:def:crs:EPSG:4326', 'neu')
];
export default _ol_proj_EPSG4326_;
