/**
 * @module ol/proj/epsg4326
 */
import {inherits} from '../util.js';
import Projection from '../proj/Projection.js';
import Units from '../proj/Units.js';


/**
 * Semi-major radius of the WGS84 ellipsoid.
 *
 * @const
 * @type {number}
 */
export const RADIUS = 6378137;


/**
 * Extent of the EPSG:4326 projection which is the whole world.
 *
 * @const
 * @type {module:ol/extent~Extent}
 */
export const EXTENT = [-180, -90, 180, 90];


/**
 * @const
 * @type {number}
 */
export const METERS_PER_UNIT = Math.PI * RADIUS / 180;


/**
 * @classdesc
 * Projection object for WGS84 geographic coordinates (EPSG:4326).
 *
 * Note that OpenLayers does not strictly comply with the EPSG definition.
 * The EPSG registry defines 4326 as a CRS for Latitude,Longitude (y,x).
 * OpenLayers treats EPSG:4326 as a pseudo-projection, with x,y coordinates.
 *
 * @constructor
 * @extends {module:ol/proj/Projection}
 * @param {string} code Code.
 * @param {string=} opt_axisOrientation Axis orientation.
 */
function EPSG4326Projection(code, opt_axisOrientation) {
  Projection.call(this, {
    code: code,
    units: Units.DEGREES,
    extent: EXTENT,
    axisOrientation: opt_axisOrientation,
    global: true,
    metersPerUnit: METERS_PER_UNIT,
    worldExtent: EXTENT
  });
}
inherits(EPSG4326Projection, Projection);


/**
 * Projections equal to EPSG:4326.
 *
 * @const
 * @type {Array.<module:ol/proj/Projection>}
 */
export const PROJECTIONS = [
  new EPSG4326Projection('CRS:84'),
  new EPSG4326Projection('EPSG:4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:EPSG::4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:EPSG:6.6:4326', 'neu'),
  new EPSG4326Projection('urn:ogc:def:crs:OGC:1.3:CRS84'),
  new EPSG4326Projection('urn:ogc:def:crs:OGC:2:84'),
  new EPSG4326Projection('http://www.opengis.net/gml/srs/epsg.xml#4326', 'neu'),
  new EPSG4326Projection('urn:x-ogc:def:crs:EPSG:4326', 'neu')
];
