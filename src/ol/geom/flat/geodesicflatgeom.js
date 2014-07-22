goog.provide('ol.geom.flat.geodesic');

goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.TransformFunction');


/**
 * Generate a geodesic line using recursive subdivision.
 *
 * @param {number} lon1 Longitude 1 in degrees.
 * @param {number} lat1 Latitude 1 in degrees.
 * @param {number} lon2 Longitude 2 in degrees.
 * @param {number} lat2 Latitude 2 in degrees.
 * @param {ol.TransformFunction} transform Transform from longitude/latitude to
 *   projected coordinates.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.geodesic.line = function(
    lon1, lat1, lon2, lat2, transform, squaredTolerance) {

  // FIXME reduce garbage generation
  // FIXME optimize stack operations

  /** @type {Array.<number>} */
  var flatCoordinates = [];

  var cosLat1 = Math.cos(goog.math.toRadians(lat1));
  var sinLat1 = Math.sin(goog.math.toRadians(lat1));
  var cosLat2 = Math.cos(goog.math.toRadians(lat2));
  var sinLat2 = Math.sin(goog.math.toRadians(lat2));
  var cosDeltaLon = Math.cos(goog.math.toRadians(lon2 - lon1));
  var sinDeltaLon = Math.sin(goog.math.toRadians(lon2 - lon1));
  var d = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDeltaLon;
  var geoAt =
      /**
       * @param {number} frac Fraction.
       * @return {ol.Coordinate} Coordinate of point `frac` between 1 and 2.
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
    var lon = goog.math.toRadians(lon1) +
        Math.atan2(Math.sin(theta) * sinD * cosLat1,
                   cosD - sinLat1 * Math.sin(lat));
    return [goog.math.toDegrees(lon), goog.math.toDegrees(lat)];
  };

  var geoLeft = [lon1, lat1];
  var geoRight = [lon2, lat2];
  var geoMid = geoAt(0.5);

  var left = transform(geoLeft);
  var right = transform(geoRight);
  var mid = transform(geoMid);

  /** @type {Array.<number>} */
  var fractionStack = [1, 0.5, 0.5, 0];
  /** @type {Array.<ol.Coordinate>} */
  var geoStack = [geoRight, geoMid, geoMid, geoLeft];
  /** @type {Array.<ol.Coordinate>} */
  var stack = [right, mid, mid, left];

  var maxIterations = 1e5;
  while (--maxIterations > 0 && fractionStack.length > 0) {
    // Pop the left coordinate off the stack
    var leftFrac = fractionStack.pop();
    left = stack.pop();
    geoLeft = geoStack.pop();
    // Always use the left coordinate
    flatCoordinates.push(left[0], left[1]);
    // Pop the right coordinate off the stack
    var rightFrac = fractionStack.pop();
    right = stack.pop();
    geoRight = geoStack.pop();
    // Find the mid point between the left and right coordinates
    var midFrac = (leftFrac + rightFrac) / 2;
    geoMid = geoAt(midFrac);
    mid = transform(geoMid);
    // Compute the error between the mid point and a straight line
    var dx = mid[0] - (left[0] + right[0]) / 2;
    var dy = mid[1] - (left[1] + right[1]) / 2;
    if (dx * dx + dy * dy < squaredTolerance) {
      // If the mid point is sufficiently close to the straight line, then we
      // discard it.  Just use the right coordinate and move on to the next line
      // segment.
      flatCoordinates.push(right[0], right[1]);
    } else {
      // Otherwise, we need to subdivide the current line segment.  Split it
      // into two and push the two line segments onto the stack.
      fractionStack.push(rightFrac, midFrac, midFrac, leftFrac);
      stack.push(right, mid, mid, left);
      geoStack.push(geoRight, geoMid, geoMid, geoLeft);
    }
  }
  goog.asserts.assert(maxIterations > 0);

  return flatCoordinates;

};
