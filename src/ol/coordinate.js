goog.provide('ol.Coordinate');
goog.provide('ol.CoordinateFormatType');
goog.provide('ol.coordinate');

goog.require('goog.math');


/**
 * @typedef {function((ol.Coordinate|undefined)): string}
 */
ol.CoordinateFormatType;


/**
 * An array representing a coordinate.
 * @typedef {Array.<number>} ol.Coordinate
 */
ol.Coordinate;


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate} Coordinate.
 */
ol.coordinate.add = function(coordinate, delta) {
  coordinate[0] += delta[0];
  coordinate[1] += delta[1];
  return coordinate;
};


/**
 * @param {number=} opt_precision Precision.
 * @return {ol.CoordinateFormatType} Coordinate format.
 */
ol.coordinate.createStringXY = function(opt_precision) {
  return (
      /**
       * @param {ol.Coordinate|undefined} coordinate Coordinate.
       * @return {string} String XY.
       */
      function(coordinate) {
        return ol.coordinate.toStringXY(coordinate, opt_precision);
      });
};


/**
 * @private
 * @param {number} degrees Degrees.
 * @param {string} hemispheres Hemispheres.
 * @return {string} String.
 */
ol.coordinate.degreesToStringHDMS_ = function(degrees, hemispheres) {
  var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(Math.round(3600 * normalizedDegrees));
  return Math.floor(x / 3600) + '\u00b0 ' +
      Math.floor((x / 60) % 60) + '\u2032 ' +
      Math.floor(x % 60) + '\u2033 ' +
      hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} angle Angle.
 * @return {ol.Coordinate} Coordinate.
 */
ol.coordinate.rotate = function(coordinate, angle) {
  var cosAngle = Math.cos(angle);
  var sinAngle = Math.sin(angle);
  var x = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
  var y = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
  coordinate[0] = x;
  coordinate[1] = y;
  return coordinate;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} s Scale.
 * @return {ol.Coordinate} Coordinate.
 */
ol.coordinate.scale = function(coordinate, s) {
  coordinate[0] *= s;
  coordinate[1] *= s;
  return coordinate;
};


/**
 * @param {ol.Coordinate} coord1 First coordinate.
 * @param {ol.Coordinate} coord2 Second coordinate.
 * @return {number} Squared distance between coord1 and coord2.
 */
ol.coordinate.squaredDistance = function(coord1, coord2) {
  var dx = coord1[0] - coord2[0];
  var dy = coord1[1] - coord2[1];
  return dx * dx + dy * dy;
};


/**
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @return {string} Hemisphere, degrees, minutes and seconds.
 */
ol.coordinate.toStringHDMS = function(coordinate) {
  if (goog.isDef(coordinate)) {
    return ol.coordinate.degreesToStringHDMS_(coordinate[1], 'NS') + ' ' +
        ol.coordinate.degreesToStringHDMS_(coordinate[0], 'EW');
  } else {
    return '';
  }
};


/**
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @param {number=} opt_precision Precision.
 * @return {string} XY.
 */
ol.coordinate.toStringXY = function(coordinate, opt_precision) {
  if (goog.isDef(coordinate)) {
    var precision = opt_precision || 0;
    return coordinate[0].toFixed(precision) + ', ' +
        coordinate[1].toFixed(precision);
  } else {
    return '';
  }
};


/**
 * Create an ol.Coordinate from an Array and take into account axis order.
 * @param {Array} array The array with coordinates.
 * @param {string} axis the axis info.
 * @return {ol.Coordinate} The coordinate created.
 */
ol.coordinate.fromProjectedArray = function(array, axis) {
  var firstAxis = axis.charAt(0);
  if (firstAxis === 'n' || firstAxis === 's') {
    return [array[1], array[0]];
  } else {
    return array;
  }
};
