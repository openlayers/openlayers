/**
 * @module ol/geom/flat/geodesic
 */
import {squaredSegmentDistance, toDegrees, toRadians} from '../../math.js';
import {get as getProjection, getTransform} from '../../proj.js';

/**
 * @param {function(number): import("../../coordinate.js").Coordinate} interpolate Interpolate function.
 * @param {import("../../proj.js").TransformFunction} transform Transform from longitude/latitude to
 *     projected coordinates.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array<number>} Flat coordinates.
 */
function line(interpolate, transform, squaredTolerance) {
  // FIXME reduce garbage generation
  // FIXME optimize stack operations

  /** @type {Array<number>} */
  const flatCoordinates = [];

  let geoA = interpolate(0);
  let geoB = interpolate(1);

  let a = transform(geoA);
  let b = transform(geoB);

  /** @type {Array<import("../../coordinate.js").Coordinate>} */
  const geoStack = [geoB, geoA];
  /** @type {Array<import("../../coordinate.js").Coordinate>} */
  const stack = [b, a];
  /** @type {Array<number>} */
  const fractionStack = [1, 0];

  /** @type {!Object<string, boolean>} */
  const fractions = {};

  let maxIterations = 1e5;
  let geoM, m, fracA, fracB, fracM, key;

  while (--maxIterations > 0 && fractionStack.length > 0) {
    // Pop the a coordinate off the stack
    fracA = fractionStack.pop();
    geoA = geoStack.pop();
    a = stack.pop();
    // Add the a coordinate if it has not been added yet
    key = fracA.toString();
    if (!(key in fractions)) {
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
    if (
      squaredSegmentDistance(m[0], m[1], a[0], a[1], b[0], b[1]) <
      squaredTolerance
    ) {
      // If the m point is sufficiently close to the straight line, then we
      // discard it.  Just use the b coordinate and move on to the next line
      // segment.
      flatCoordinates.push(b[0], b[1]);
      key = fracB.toString();
      fractions[key] = true;
    } else {
      // Otherwise, we need to subdivide the current line segment.  Split it
      // into two and push the two line segments onto the stack.
      fractionStack.push(fracB, fracM, fracM, fracA);
      stack.push(b, m, m, a);
      geoStack.push(geoB, geoM, geoM, geoA);
    }
  }

  return flatCoordinates;
}

/**
 * Generate a great-circle arcs between two lat/lon points.
 * @param {number} lon1 Longitude 1 in degrees.
 * @param {number} lat1 Latitude 1 in degrees.
 * @param {number} lon2 Longitude 2 in degrees.
 * @param {number} lat2 Latitude 2 in degrees.
 * @param {import("../../proj/Projection.js").default} projection Projection.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array<number>} Flat coordinates.
 */
export function greatCircleArc(
  lon1,
  lat1,
  lon2,
  lat2,
  projection,
  squaredTolerance,
) {
  const geoProjection = getProjection('EPSG:4326');

  const cosLat1 = Math.cos(toRadians(lat1));
  const sinLat1 = Math.sin(toRadians(lat1));
  const cosLat2 = Math.cos(toRadians(lat2));
  const sinLat2 = Math.sin(toRadians(lat2));
  const cosDeltaLon = Math.cos(toRadians(lon2 - lon1));
  const sinDeltaLon = Math.sin(toRadians(lon2 - lon1));
  const d = sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDeltaLon;

  return line(
    /**
     * @param {number} frac Fraction.
     * @return {import("../../coordinate.js").Coordinate} Coordinate.
     */
    function (frac) {
      if (1 <= d) {
        return [lon2, lat2];
      }
      const D = frac * Math.acos(d);
      const cosD = Math.cos(D);
      const sinD = Math.sin(D);
      const y = sinDeltaLon * cosLat2;
      const x = cosLat1 * sinLat2 - sinLat1 * cosLat2 * cosDeltaLon;
      const theta = Math.atan2(y, x);
      const lat = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(theta));
      const lon =
        toRadians(lon1) +
        Math.atan2(
          Math.sin(theta) * sinD * cosLat1,
          cosD - sinLat1 * Math.sin(lat),
        );
      return [toDegrees(lon), toDegrees(lat)];
    },
    getTransform(geoProjection, projection),
    squaredTolerance,
  );
}

/**
 * Generate a meridian (line at constant longitude).
 * @param {number} lon Longitude.
 * @param {number} lat1 Latitude 1.
 * @param {number} lat2 Latitude 2.
 * @param {import("../../proj/Projection.js").default} projection Projection.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array<number>} Flat coordinates.
 */
export function meridian(lon, lat1, lat2, projection, squaredTolerance) {
  const epsg4326Projection = getProjection('EPSG:4326');
  return line(
    /**
     * @param {number} frac Fraction.
     * @return {import("../../coordinate.js").Coordinate} Coordinate.
     */
    function (frac) {
      return [lon, lat1 + (lat2 - lat1) * frac];
    },
    getTransform(epsg4326Projection, projection),
    squaredTolerance,
  );
}

/**
 * Generate a parallel (line at constant latitude).
 * @param {number} lat Latitude.
 * @param {number} lon1 Longitude 1.
 * @param {number} lon2 Longitude 2.
 * @param {import("../../proj/Projection.js").default} projection Projection.
 * @param {number} squaredTolerance Squared tolerance.
 * @return {Array<number>} Flat coordinates.
 */
export function parallel(lat, lon1, lon2, projection, squaredTolerance) {
  const epsg4326Projection = getProjection('EPSG:4326');
  return line(
    /**
     * @param {number} frac Fraction.
     * @return {import("../../coordinate.js").Coordinate} Coordinate.
     */
    function (frac) {
      return [lon1 + (lon2 - lon1) * frac, lat];
    },
    getTransform(epsg4326Projection, projection),
    squaredTolerance,
  );
}
