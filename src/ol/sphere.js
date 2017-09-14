/**
 * @license
 * Latitude/longitude spherical geodesy formulae taken from
 * http://www.movable-type.co.uk/scripts/latlong.html
 * Licensed under CC-BY-3.0.
 */

goog.provide('ol.Sphere');

goog.require('ol.math');
goog.require('ol.geom.GeometryType');


/**
 * @classdesc
 * Class to create objects that can be used with {@link
 * ol.geom.Polygon.circular}.
 *
 * For example to create a sphere whose radius is equal to the semi-major
 * axis of the WGS84 ellipsoid:
 *
 * ```js
 * var wgs84Sphere= new ol.Sphere(6378137);
 * ```
 *
 * @constructor
 * @param {number} radius Radius.
 * @api
 */
ol.Sphere = function(radius) {

  /**
   * @type {number}
   */
  this.radius = radius;

};


/**
 * Returns the geodesic area for a list of coordinates.
 *
 * [Reference](https://trs-new.jpl.nasa.gov/handle/2014/40409)
 * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
 * Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
 * Laboratory, Pasadena, CA, June 2007
 *
 * @param {Array.<ol.Coordinate>} coordinates List of coordinates of a linear
 * ring. If the ring is oriented clockwise, the area will be positive,
 * otherwise it will be negative.
 * @return {number} Area.
 * @api
 */
ol.Sphere.prototype.geodesicArea = function(coordinates) {
  return ol.Sphere.getArea_(coordinates, this.radius);
};


/**
 * Returns the distance from c1 to c2 using the haversine formula.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Haversine distance.
 * @api
 */
ol.Sphere.prototype.haversineDistance = function(c1, c2) {
  return ol.Sphere.getDistance_(c1, c2, this.radius);
};


/**
 * Returns the coordinate at the given distance and bearing from `c1`.
 *
 * @param {ol.Coordinate} c1 The origin point (`[lon, lat]` in degrees).
 * @param {number} distance The great-circle distance between the origin
 *     point and the target point.
 * @param {number} bearing The bearing (in radians).
 * @return {ol.Coordinate} The target point.
 */
ol.Sphere.prototype.offset = function(c1, distance, bearing) {
  var lat1 = ol.math.toRadians(c1[1]);
  var lon1 = ol.math.toRadians(c1[0]);
  var dByR = distance / this.radius;
  var lat = Math.asin(
      Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
  var lon = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
  return [ol.math.toDegrees(lon), ol.math.toDegrees(lat)];
};


/**
 * The mean Earth radius (1/3 * (2a + b)) for the WGS84 ellipsoid.
 * https://en.wikipedia.org/wiki/Earth_radius#Mean_radius
 * @type {number}
 */
ol.Sphere.DEFAULT_RADIUS = 6371008.8;


/**
 * Get the spherical length of a geometry.  This length is the sum of the
 * great circle distances between coordinates.  For polygons, the length is
 * the sum of all rings.  For points, the length is zero.  For multi-part
 * geometries, the length is the sum of the length of each part.
 * @param {ol.geom.Geometry} geometry A geometry.
 * @param {olx.SphereMetricOptions=} opt_options Options for the length
 *     calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 *     You can change this by providing a `projection` option.
 * @return {number} The spherical length (in meters).
 * @api
 */
ol.Sphere.getLength = function(geometry, opt_options) {
  var options = opt_options || {};
  var radius = options.radius || ol.Sphere.DEFAULT_RADIUS;
  var projection = options.projection || 'EPSG:3857';
  geometry = geometry.clone().transform(projection, 'EPSG:4326');
  var type = geometry.getType();
  var length = 0;
  var coordinates, coords, i, ii, j, jj;
  switch (type) {
    case ol.geom.GeometryType.POINT:
    case ol.geom.GeometryType.MULTI_POINT: {
      break;
    }
    case ol.geom.GeometryType.LINE_STRING:
    case ol.geom.GeometryType.LINEAR_RING: {
      coordinates = /** @type {ol.geom.SimpleGeometry} */ (geometry).getCoordinates();
      length = ol.Sphere.getLength_(coordinates, radius);
      break;
    }
    case ol.geom.GeometryType.MULTI_LINE_STRING:
    case ol.geom.GeometryType.POLYGON: {
      coordinates = /** @type {ol.geom.SimpleGeometry} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        length += ol.Sphere.getLength_(coordinates[i], radius);
      }
      break;
    }
    case ol.geom.GeometryType.MULTI_POLYGON: {
      coordinates = /** @type {ol.geom.SimpleGeometry} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        for (j = 0, jj = coords.length; j < jj; ++j) {
          length += ol.Sphere.getLength_(coords[j], radius);
        }
      }
      break;
    }
    case ol.geom.GeometryType.GEOMETRY_COLLECTION: {
      var geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        length += ol.Sphere.getLength(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return length;
};


/**
 * Get the cumulative great circle length of linestring coordinates (geographic).
 * @param {Array} coordinates Linestring coordinates.
 * @param {number} radius The sphere radius to use.
 * @return {number} The length (in meters).
 */
ol.Sphere.getLength_ = function(coordinates, radius) {
  var length = 0;
  for (var i = 0, ii = coordinates.length; i < ii - 1; ++i) {
    length += ol.Sphere.getDistance_(coordinates[i], coordinates[i + 1], radius);
  }
  return length;
};


/**
 * Get the great circle distance between two geographic coordinates.
 * @param {Array} c1 Starting coordinate.
 * @param {Array} c2 Ending coordinate.
 * @param {number} radius The sphere radius to use.
 * @return {number} The great circle distance between the points (in meters).
 */
ol.Sphere.getDistance_ = function(c1, c2, radius) {
  var lat1 = ol.math.toRadians(c1[1]);
  var lat2 = ol.math.toRadians(c2[1]);
  var deltaLatBy2 = (lat2 - lat1) / 2;
  var deltaLonBy2 = ol.math.toRadians(c2[0] - c1[0]) / 2;
  var a = Math.sin(deltaLatBy2) * Math.sin(deltaLatBy2) +
      Math.sin(deltaLonBy2) * Math.sin(deltaLonBy2) *
      Math.cos(lat1) * Math.cos(lat2);
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


/**
 * Get the spherical area of a geometry.  This is the area (in meters) assuming
 * that polygon edges are segments of great circles on a sphere.
 * @param {ol.geom.Geometry} geometry A geometry.
 * @param {olx.SphereMetricOptions=} opt_options Options for the area
 *     calculation.  By default, geometries are assumed to be in 'EPSG:3857'.
 *     You can change this by providing a `projection` option.
 * @return {number} The spherical area (in square meters).
 * @api
 */
ol.Sphere.getArea = function(geometry, opt_options) {
  var options = opt_options || {};
  var radius = options.radius || ol.Sphere.DEFAULT_RADIUS;
  var projection = options.projection || 'EPSG:3857';
  geometry = geometry.clone().transform(projection, 'EPSG:4326');
  var type = geometry.getType();
  var area = 0;
  var coordinates, coords, i, ii, j, jj;
  switch (type) {
    case ol.geom.GeometryType.POINT:
    case ol.geom.GeometryType.MULTI_POINT:
    case ol.geom.GeometryType.LINE_STRING:
    case ol.geom.GeometryType.MULTI_LINE_STRING:
    case ol.geom.GeometryType.LINEAR_RING: {
      break;
    }
    case ol.geom.GeometryType.POLYGON: {
      coordinates = /** @type {ol.geom.Polygon} */ (geometry).getCoordinates();
      area = Math.abs(ol.Sphere.getArea_(coordinates[0], radius));
      for (i = 1, ii = coordinates.length; i < ii; ++i) {
        area -= Math.abs(ol.Sphere.getArea_(coordinates[i], radius));
      }
      break;
    }
    case ol.geom.GeometryType.MULTI_POLYGON: {
      coordinates = /** @type {ol.geom.SimpleGeometry} */ (geometry).getCoordinates();
      for (i = 0, ii = coordinates.length; i < ii; ++i) {
        coords = coordinates[i];
        area += Math.abs(ol.Sphere.getArea_(coords[0], radius));
        for (j = 1, jj = coords.length; j < jj; ++j) {
          area -= Math.abs(ol.Sphere.getArea_(coords[j], radius));
        }
      }
      break;
    }
    case ol.geom.GeometryType.GEOMETRY_COLLECTION: {
      var geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        area += ol.Sphere.getArea(geometries[i], opt_options);
      }
      break;
    }
    default: {
      throw new Error('Unsupported geometry type: ' + type);
    }
  }
  return area;
};


/**
 * Returns the spherical area for a list of coordinates.
 *
 * [Reference](https://trs-new.jpl.nasa.gov/handle/2014/40409)
 * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
 * Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
 * Laboratory, Pasadena, CA, June 2007
 *
 * @param {Array.<ol.Coordinate>} coordinates List of coordinates of a linear
 * ring. If the ring is oriented clockwise, the area will be positive,
 * otherwise it will be negative.
 * @param {number} radius The sphere radius.
 * @return {number} Area (in square meters).
 */
ol.Sphere.getArea_ = function(coordinates, radius) {
  var area = 0, len = coordinates.length;
  var x1 = coordinates[len - 1][0];
  var y1 = coordinates[len - 1][1];
  for (var i = 0; i < len; i++) {
    var x2 = coordinates[i][0], y2 = coordinates[i][1];
    area += ol.math.toRadians(x2 - x1) *
        (2 + Math.sin(ol.math.toRadians(y1)) +
        Math.sin(ol.math.toRadians(y2)));
    x1 = x2;
    y1 = y2;
  }
  return area * radius * radius / 2.0;
};
