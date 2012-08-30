goog.provide('ol3.CoordinateFormat');
goog.provide('ol3.CoordinateFormatType');

goog.require('goog.math');
goog.require('ol3.Coordinate');


/**
 * @typedef {function((ol3.Coordinate|undefined)): string}
 */
ol3.CoordinateFormatType;


/**
 * @param {number} precision Precision.
 * @return {ol3.CoordinateFormatType} Coordinate format.
 */
ol3.CoordinateFormat.createXY = function(precision) {
  return function(coordinate) {
    if (goog.isDef(coordinate)) {
      return coordinate.x.toFixed(precision) + ', ' +
          coordinate.y.toFixed(precision);
    } else {
      return '';
    }
  };
};


/**
 * @private
 * @param {number} degrees Degrees.
 * @param {string} hemispheres Hemispheres.
 * @return {string} String.
 */
ol3.CoordinateFormat.degreesToHDMS_ = function(degrees, hemispheres) {
  var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(Math.round(3600 * normalizedDegrees));
  return Math.floor(x / 3600) + '\u00b0 ' +
      Math.floor((x / 60) % 60) + '\u2032 ' +
      Math.floor(x % 60) + '\u2033 ' +
      hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
};


/**
 * @param {ol3.Coordinate|undefined} coordinate Coordinate.
 * @return {string} Coordinate format.
 */
ol3.CoordinateFormat.hdms = function(coordinate) {
  if (goog.isDef(coordinate)) {
    return ol3.CoordinateFormat.degreesToHDMS_(coordinate.y, 'NS') + ' ' +
        ol3.CoordinateFormat.degreesToHDMS_(coordinate.x, 'EW');
  } else {
    return '';
  }
};
