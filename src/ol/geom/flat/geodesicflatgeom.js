goog.provide('ol.geom.flat.geodesic');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.TransformFunction');
goog.require('ol.math');
goog.require('ol.proj');


/**
 * @private
 * @param {function(number): ol.Coordinate} interpolate Interpolate function.
 * @param {ol.TransformFunction} transform Transform from longitude/latitude to
 *     projected coordinates.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.geodesic.line_ =
    function(interpolate, transform, squaredTolerance) {
  // FIXME reduce garbage generation
  // FIXME optimize stack operations

  /** @type {Array.<number>} */
  var flatCoordinates = [];

  var geoA = interpolate(0);
  var geoB = interpolate(1);

  var a = transform(geoA);
  var b = transform(geoB);

  /** @type {Array.<ol.Coordinate>} */
  var geoStack = [geoB, geoA];
  /** @type {Array.<ol.Coordinate>} */
  var stack = [b, a];
  /** @type {Array.<number>} */
  var fractionStack = [1, 0];

  /** @type {Object.<string, boolean>} */
  var fractions = {};

  var maxIterations = 1e5;
  var geoM, m, fracA, fracB, fracM, key;

  while (--maxIterations > 0 && fractionStack.length > 0) {
    // Pop the a coordinate off the stack
    fracA = fractionStack.pop();
    geoA = geoStack.pop();
    a = stack.pop();
    // Add the a coordinate if it has not been added yet
    key = fracA.toString();
    if (!goog.object.containsKey(fractions, key)) {
      flatCoordinates.push(a[0], a[1]);
      fractions[key] = true;
    }
    // Pop the b coordinate off the stack
    fracB = fractionStack.pop();
    geoB = geoStack.pop();
    b = stack.pop();
    // Find the m point between the a and b coordinates
    fracM = (fracA + fracB) / 2;
    geoM = interpolate(fracM);
    m = transform(geoM);
    if (ol.math.squaredSegmentDistance(m[0], m[1], a[0], a[1],
        b[0], b[1]) < squaredTolerance) {
      // If the m point is sufficiently close to the straight line, then we
      // discard it.  Just use the b coordinate and move on to the next line
      // segment.
      flatCoordinates.push(b[0], b[1]);
      key = fracB.toString();
      goog.asserts.assert(!goog.object.containsKey(fractions, key),
          'fractions object should contain key : ' + key);
      fractions[key] = true;
    } else {
      // Otherwise, we need to subdivide the current line segment.  Split it
      // into two and push the two line segments onto the stack.
      fractionStack.push(fracB, fracM, fracM, fracA);
      stack.push(b, m, m, a);
      geoStack.push(geoB, geoM, geoM, geoA);
    }
  }
  goog.asserts.assert(maxIterations > 0,
      'maxIterations should be more than 0');

  return flatCoordinates;
};


/**
* Generate a great-circle arcs between two lat/lon points.
* @param {number} lon1 Longitude 1 in degrees.
* @param {number} lat1 Latitude 1 in degrees.
* @param {number} lon2 Longitude 2 in degrees.
* @param {number} lat2 Latitude 2 in degrees.
 * @param {ol.proj.Projection} projection Projection.
* @param {number} squaredTolerance Squared tolerance.
* @return {Array.<number>} Flat coordinates.
*/
ol.geom.flat.geodesic.greatCircleArc = function(
    lon1, lat1, lon2, lat2, projection, squaredTolerance) {

  var geoProjection = ol.proj.get('EPSG:4326');

  var cosLat1 = Math.cos(ol.math.toRadians(lat1));
  var sinLat1 = Math.sin(ol.math.toRadians(lat1));
  var cosLat2 = Math.cos(ol.math.toRadians(lat2));
  var sinLat2 = Math.sin(ol.math.toRadians(lat2));
  var cosDeltaLon = Math.cos(ol.math.toRadians(lon2 - lon1));
  var sinDeltaLon = Math.sin(ol.math.toRadians(lon2 - lon1));
  var d = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDeltaLon;

  return ol.geom.flat.geodesic.line_(
      /**
       * @param {number} frac Fraction.
       * @return {ol.Coordinate} Coordinate.
       */
      function(frac) {
        if (1 <= d) {
          return [lon2, lat2];
        }
        var D = frac * Math.acos(d);
        var cosD = Math.cos(D);
        var sinD = Math.sin(D);
        var y = sinDeltaLon * cosLat2;
        var x = cosLat1 * sinLat2 - sinLat1 * cosLat2 * cosDeltaLon;
        var theta = Math.atan2(y, x);
        var lat = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(theta));
        var lon = ol.math.toRadians(lon1) +
            Math.atan2(Math.sin(theta) * sinD * cosLat1,
                       cosD - sinLat1 * Math.sin(lat));
        return [ol.math.toDegrees(lon), ol.math.toDegrees(lat)];
      }, ol.proj.getTransform(geoProjection, projection), squaredTolerance);
};


/**
 * Generate a meridian (line at constant longitude).
 * @param {number} lon Longitude.
 * @param {number} lat1 Latitude 1.
 * @param {number} lat2 Latitude 2.
 * @param {ol.proj.Projection} projection Projection.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.geodesic.meridian =
    function(lon, lat1, lat2, projection, squaredTolerance) {
  var epsg4326Projection = ol.proj.get('EPSG:4326');
  return ol.geom.flat.geodesic.line_(
      /**
       * @param {number} frac Fraction.
       * @return {ol.Coordinate} Coordinate.
       */
      function(frac) {
        return [lon, lat1 + ((lat2 - lat1) * frac)];
      },
      ol.proj.getTransform(epsg4326Projection, projection), squaredTolerance);
};


/**
 * Generate a parallel (line at constant latitude).
 * @param {number} lat Latitude.
 * @param {number} lon1 Longitude 1.
 * @param {number} lon2 Longitude 2.
 * @param {ol.proj.Projection} projection Projection.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.geodesic.parallel =
    function(lat, lon1, lon2, projection, squaredTolerance) {
  var epsg4326Projection = ol.proj.get('EPSG:4326');
  return ol.geom.flat.geodesic.line_(
      /**
       * @param {number} frac Fraction.
       * @return {ol.Coordinate} Coordinate.
       */
      function(frac) {
        return [lon1 + ((lon2 - lon1) * frac), lat];
      },
      ol.proj.getTransform(epsg4326Projection, projection), squaredTolerance);
};
