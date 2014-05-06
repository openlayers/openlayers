/**
 * @license
 * Latitude/longitude spherical geodesy formulae taken from
 * http://www.movable-type.co.uk/scripts/latlong.html
 * Licenced under CC-BY-3.0.
 */

// FIXME add intersection of two paths given start points and bearings
// FIXME add rhumb lines

goog.provide('ol.Sphere');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @param {number} radius Radius.
 */
ol.Sphere = function(radius) {

  /**
   * @type {number}
   */
  this.radius = radius;

};


/**
 * Returns an approximation to a circle centered on `center` with radius
 * `radius` with `n` distinct points.
 *
 * @param {ol.Coordinate} center Center.
 * @param {number} radius Radius.
 * @param {number=} opt_n N.
 * @return {ol.geom.Geometry} Circle geometry.
 * @todo api
 */
ol.Sphere.prototype.circle = function(center, radius, opt_n) {
  var n = goog.isDef(opt_n) ? opt_n : 32;
  /** @type {Array.<number>} */
  var flatCoordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    goog.array.extend(
        flatCoordinates, this.offset(center, radius, 2 * Math.PI * i / n));
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);
  var polygon = new ol.geom.Polygon(null);
  polygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, flatCoordinates, [flatCoordinates.length]);
  return polygon;
};


/**
 * Returns the distance from c1 to c2 using the spherical law of cosines.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Spherical law of cosines distance.
 */
ol.Sphere.prototype.cosineDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var deltaLon = goog.math.toRadians(c2[0] - c1[0]);
  return this.radius * Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon));
};


/**
 * Returns the distance of c3 from the great circle path defined by c1 and c2.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @param {ol.Coordinate} c3 Coordinate 3.
 * @return {number} Cross-track distance.
 */
ol.Sphere.prototype.crossTrackDistance = function(c1, c2, c3) {
  var d13 = this.cosineDistance(c1, c2);
  var theta12 = goog.math.toRadians(this.initialBearing(c1, c2));
  var theta13 = goog.math.toRadians(this.initialBearing(c1, c3));
  return this.radius *
      Math.asin(Math.sin(d13 / this.radius) * Math.sin(theta13 - theta12));
};


/**
 * Returns the distance from c1 to c2 using Pythagoras's theorem on an
 * equirectangular projection.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Equirectangular distance.
 */
ol.Sphere.prototype.equirectangularDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var deltaLon = goog.math.toRadians(c2[0] - c1[0]);
  var x = deltaLon * Math.cos((lat1 + lat2) / 2);
  var y = lat2 - lat1;
  return this.radius * Math.sqrt(x * x + y * y);
};


/**
 * Returns the final bearing from c1 to c2.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Initial bearing.
 */
ol.Sphere.prototype.finalBearing = function(c1, c2) {
  return (this.initialBearing(c2, c1) + 180) % 360;
};


/**
 * Returns the distance from c1 to c2 using the haversine formula.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Haversine distance.
 */
ol.Sphere.prototype.haversineDistance = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var deltaLatBy2 = (lat2 - lat1) / 2;
  var deltaLonBy2 = goog.math.toRadians(c2[0] - c1[0]) / 2;
  var a = Math.sin(deltaLatBy2) * Math.sin(deltaLatBy2) +
      Math.sin(deltaLonBy2) * Math.sin(deltaLonBy2) *
      Math.cos(lat1) * Math.cos(lat2);
  return 2 * this.radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


/**
 * Returns the point at `fraction` along the segment of the great circle passing
 * through c1 and c2.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @param {number} fraction Fraction.
 * @return {ol.Coordinate} Coordinate between c1 and c2.
 */
ol.Sphere.prototype.interpolate = function(c1, c2, fraction) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lon1 = goog.math.toRadians(c1[0]);
  var lat2 = goog.math.toRadians(c2[1]);
  var lon2 = goog.math.toRadians(c2[0]);
  var cosLat1 = Math.cos(lat1);
  var sinLat1 = Math.sin(lat1);
  var cosLat2 = Math.cos(lat2);
  var sinLat2 = Math.sin(lat2);
  var cosDeltaLon = Math.cos(lon2 - lon1);
  var d = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDeltaLon;
  if (1 <= d) {
    return c2.slice();
  }
  d = fraction * Math.acos(d);
  var cosD = Math.cos(d);
  var sinD = Math.sin(d);
  var y = Math.sin(lon2 - lon1) * cosLat2;
  var x = cosLat1 * sinLat2 - sinLat1 * cosLat2 * cosDeltaLon;
  var theta = Math.atan2(y, x);
  var lat = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(theta));
  var lon = lon1 + Math.atan2(Math.sin(theta) * sinD * cosLat1,
                              cosD - sinLat1 * Math.sin(lat));
  return [goog.math.toDegrees(lon), goog.math.toDegrees(lat)];
};


/**
 * Returns the initial bearing from c1 to c2.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {number} Initial bearing.
 */
ol.Sphere.prototype.initialBearing = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var deltaLon = goog.math.toRadians(c2[0] - c1[0]);
  var y = Math.sin(deltaLon) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return goog.math.toDegrees(Math.atan2(y, x));
};


/**
 * Returns the maximum latitude of the great circle defined by bearing and
 * latitude.
 *
 * @param {number} bearing Bearing.
 * @param {number} latitude Latitude.
 * @return {number} Maximum latitude.
 */
ol.Sphere.prototype.maximumLatitude = function(bearing, latitude) {
  return Math.cos(Math.abs(Math.sin(goog.math.toRadians(bearing)) *
                           Math.cos(goog.math.toRadians(latitude))));
};


/**
 * Returns the midpoint between c1 and c2.
 *
 * @param {ol.Coordinate} c1 Coordinate 1.
 * @param {ol.Coordinate} c2 Coordinate 2.
 * @return {ol.Coordinate} Midpoint.
 */
ol.Sphere.prototype.midpoint = function(c1, c2) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lat2 = goog.math.toRadians(c2[1]);
  var lon1 = goog.math.toRadians(c1[0]);
  var deltaLon = goog.math.toRadians(c2[0] - c1[0]);
  var Bx = Math.cos(lat2) * Math.cos(deltaLon);
  var By = Math.cos(lat2) * Math.sin(deltaLon);
  var cosLat1PlusBx = Math.cos(lat1) + Bx;
  var lat = Math.atan2(Math.sin(lat1) + Math.sin(lat2),
                       Math.sqrt(cosLat1PlusBx * cosLat1PlusBx + By * By));
  var lon = lon1 + Math.atan2(By, cosLat1PlusBx);
  return [goog.math.toDegrees(lon), goog.math.toDegrees(lat)];
};


/**
 * Returns the coordinate at the given distance and bearing from c.
 *
 * @param {ol.Coordinate} c1 Coordinate.
 * @param {number} distance Distance.
 * @param {number} bearing Bearing.
 * @return {ol.Coordinate} Coordinate.
 */
ol.Sphere.prototype.offset = function(c1, distance, bearing) {
  var lat1 = goog.math.toRadians(c1[1]);
  var lon1 = goog.math.toRadians(c1[0]);
  var dByR = distance / this.radius;
  var lat = Math.asin(
      Math.sin(lat1) * Math.cos(dByR) +
      Math.cos(lat1) * Math.sin(dByR) * Math.cos(bearing));
  var lon = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
  return [goog.math.toDegrees(lon), goog.math.toDegrees(lat)];
};
