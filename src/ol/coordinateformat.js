goog.provide('ol.CoordinateFormat');
goog.provide('ol.CoordinateFormatType');

goog.require('goog.math');
goog.require('ol.Coordinate');


/**
 * @typedef {function((ol.Coordinate|undefined)): string}
 */
ol.CoordinateFormatType;


/**
 * @param {number} precision Precision.
 * @return {ol.CoordinateFormatType} Coordinate format.
 */
ol.CoordinateFormat.createXY = function(precision) {
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
ol.CoordinateFormat.degreesToHDMS_ = function(degrees, hemispheres) {
  var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(Math.round(3600 * normalizedDegrees));
  return Math.floor(x / 3600) + '\u00b0 ' +
      Math.floor((x / 60) % 60) + '\u2032 ' +
      Math.floor(x % 60) + '\u2033 ' +
      hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
};


/**
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @return {string} Coordinate format.
 */
ol.CoordinateFormat.hdms = function(coordinate) {
  if (goog.isDef(coordinate)) {
    return ol.CoordinateFormat.degreesToHDMS_(coordinate.y, 'NS') + ' ' +
        ol.CoordinateFormat.degreesToHDMS_(coordinate.x, 'EW');
  } else {
    return '';
  }
};
