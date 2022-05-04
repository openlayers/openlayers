/**
 * @module ol/geodesy
 */

/**
 *
 * This module utilized geographiclib to perform ellipsoid/geodesy
 * based measurements of length and area. These calculation are more
 * accurate than the spherical approximation of ol/sphere but are
 * more computationally expensive. The approximation gets less accurate
 * for "tall" geometries and those near the equator, where the Earth is wider.
 */
import GeometryType from './geom/GeometryType.js';
import geographiclib from 'geographiclib';

/**
 * Object literal with options for the {@link getLength} or {@link getArea}
 * functions.
 * @typedef {Object} GeodOptions
 * @property {import("./proj.js").ProjectionLike} [projection='EPSG:3857']
 * Projection of the  geometry.  By default, the geometry is assumed to be in
 * Web Mercator.
 * @property {Object} [geod=geographiclib.Geodesic.WGS84] The geod to use for
 * calculation, defaults to WGS84 ellipsoid.
 */

/**
 * Get the geod distance (in meters) between two geographic coordinates.
 * @param {Array} c1 Starting coordinate.
 * @param {Array} c2 Ending coordinate.
 * @param {Object} [opt_geod] The geod to use. Defaults to WGS84.
 * @return {number} The great circle distance between the points (in meters).
 * @api
 */
export function getDistance(c1, c2, opt_geod) {
  const geod = opt_geod || geographiclib.Geodesic.WGS84;
  // this comes back as meters!
  return geod.InverseLine(c1[1], c1[0], c2[1], c2[0]).s13;
}

/**
 * Get the cumulative geod length of linestring coordinates (geographic).
 * @param {Array} coordinates Linestring coordinates.
 * @param {number} [opt_geod] The geod to use. Defaults to WGS84.
 * @return {number} The length (in meters).
 */
function getLengthInternal(coordinates, opt_geod) {
  let length = 0;
  for (let i = 0, ii = coordinates.length; i < ii - 1; ++i) {
    length += getDistance(coordinates[i], coordinates[i + 1], opt_geod);
  }
  return length;
}

/**
 * Get the geodic length of a geometry. This length is the sum of the
 * geodic arc distances between coordinates.  For polygons, the length is
 * the sum of all rings.  For points, the length is zero.  For multi-part
 * geometries, the length is the sum of the length of each part.
 * @param {import("./geom/Geometry.js").default} geometry A geometry.
 * @param {GeodOptions} [opt_options] Options for the
 * length calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 * You can change this by providing a `projection` option.
 * @return {number} The spherical length (in meters).
 * @api
 */
export function getLength(geometry, opt_options) {
  const options = opt_options || {};
  const opt_geod = options.geod || geographiclib.Geodesic.WGS84;
  const projection = options.projection || 'EPSG:3857';
  const type = geometry.getType();
  if (type !== GeometryType.GEOMETRY_COLLECTION) {
    // eslint-disable-next-line
    geometry = geometry.clone().transform(projection, 'EPSG:4326');
  }
  let length = 0;
  let coordinates, coords, i, ii, j, jj;
  switch (type) {
    case GeometryType.POINT:
    case GeometryType.MULTI_POINT: {
      break;
    }
    case GeometryType.LINE_STRING:
    case GeometryType.LINEAR_RING: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (
        geometry
      ).getCoordinates();
      length = getLengthInternal(coordinates, opt_geod);
      break;
    }
    case GeometryType.MULTI_LINE_STRING:
    case GeometryType.POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (
        geometry
      ).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        length += getLengthInternal(coordinates[i], opt_geod);
      }
      break;
    }
    case GeometryType.MULTI_POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (
        geometry
      ).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        for (j = 0, jj = coords.length; j < jj; ++j) {
          length += getLengthInternal(coords[j], opt_geod);
        }
      }
      break;
    }
    case GeometryType.GEOMETRY_COLLECTION: {
      const geometries =
        /** @type {import("./geom/GeometryCollection.js").default} */ (
          geometry
        ).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        length += getLength(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return length;
}

/**
 * Returns the geodesic area for a list of coordinates.
 *
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates List of coordinates of a linear
 * ring. If the ring is oriented clockwise, the area will be positive,
 * otherwise it will be negative.
 * @param {Object} geod The geod to use for calculation.
 * @return {number} Area (in square meters).
 */
function getAreaInternal(coordinates, geod) {
  const polyArea = new geographiclib.PolygonArea.PolygonArea(geod);
  // add all the points in the ring
  for (let i = 0, ii = coordinates.length; i < ii; ++i) {
    const pt = coordinates[i];
    polyArea.AddPoint(pt[1], pt[0]);
  }
  return polyArea.Compute(true, true).area;
}

/**
 * Get the spherical area of a geometry.  This is the area (in meters) assuming
 * that polygon edges are segments of ellipses on a geod.
 * @param {import("./geom/Geometry.js").default} geometry A geometry.
 * @param {GeodOptions} [opt_options] Options for the area
 *     calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 *     You can change this by providing a `projection` option.
 * @return {number} The spherical area (in square meters).
 * @api
 */
export function getArea(geometry, opt_options) {
  const options = opt_options || {};
  const opt_geod = options.geod || geographiclib.Geodesic.WGS84;
  const projection = options.projection || 'EPSG:3857';
  const type = geometry.getType();
  if (type !== GeometryType.GEOMETRY_COLLECTION) {
    // eslint-disable-next-line
    geometry = geometry.clone().transform(projection, 'EPSG:4326');
  }
  let area = 0;
  let coordinates, coords, i, ii, j, jj;
  switch (type) {
    case GeometryType.POINT:
    case GeometryType.MULTI_POINT:
    case GeometryType.LINE_STRING:
    case GeometryType.MULTI_LINE_STRING:
    case GeometryType.LINEAR_RING: {
      break;
    }
    case GeometryType.POLYGON: {
      coordinates = /** @type {import("./geom/Polygon.js").default} */ (
        geometry
      ).getCoordinates();
      area = Math.abs(getAreaInternal(coordinates[0], opt_geod));
      for (i = 1, ii = coordinates.length; i < ii; ++i) {
        area -= Math.abs(getAreaInternal(coordinates[i], opt_geod));
      }
      break;
    }
    case GeometryType.MULTI_POLYGON: {
      coordinates = /** @type {import("./geom/SimpleGeometry.js").default} */ (
        geometry
      ).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        area += Math.abs(getAreaInternal(coords[0], opt_geod));
        for (j = 1, jj = coords.length; j < jj; ++j) {
          area -= Math.abs(getAreaInternal(coords[j], opt_geod));
        }
      }
      break;
    }
    case GeometryType.GEOMETRY_COLLECTION: {
      const geometries =
        /** @type {import("./geom/GeometryCollection.js").default} */ (
          geometry
        ).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        area += getArea(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return area;
}
