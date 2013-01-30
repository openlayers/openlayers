goog.provide('ol.Coordinate');
goog.provide('ol.CoordinateFormatType');

goog.require('goog.math');
goog.require('goog.math.Vec2');


/**
 * @typedef {function((ol.Coordinate|undefined)): string}
 */
ol.CoordinateFormatType;



/**
 * Two dimensional coordinate which does not know its projection.
 *
 * @constructor
 * @extends {goog.math.Vec2}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.Coordinate = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol.Coordinate, goog.math.Vec2);


/**
 * @const
 * @type {ol.Coordinate}
 */
ol.Coordinate.ZERO = new ol.Coordinate(0, 0);


/**
 * @param {number=} opt_precision Precision.
 * @return {ol.CoordinateFormatType} Coordinate format.
 */
ol.Coordinate.createStringXY = function(opt_precision) {
  return function(coordinate) {
    return ol.Coordinate.toStringXY(coordinate, opt_precision);
  };
};


/**
 * @private
 * @param {number} degrees Degrees.
 * @param {string} hemispheres Hemispheres.
 * @return {string} String.
 */
ol.Coordinate.degreesToStringHDMS_ = function(degrees, hemispheres) {
  var normalizedDegrees = goog.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(Math.round(3600 * normalizedDegrees));
  return Math.floor(x / 3600) + '\u00b0 ' +
      Math.floor((x / 60) % 60) + '\u2032 ' +
      Math.floor(x % 60) + '\u2033 ' +
      hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
};


/**
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @return {string} Hemisphere, degrees, minutes and seconds.
 */
ol.Coordinate.toStringHDMS = function(coordinate) {
  if (goog.isDef(coordinate)) {
    return ol.Coordinate.degreesToStringHDMS_(coordinate.y, 'NS') + ' ' +
        ol.Coordinate.degreesToStringHDMS_(coordinate.x, 'EW');
  } else {
    return '';
  }
};


/**
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @param {number=} opt_precision Precision.
 * @return {string} XY.
 */
ol.Coordinate.toStringXY = function(coordinate, opt_precision) {
  if (goog.isDef(coordinate)) {
    var precision = opt_precision || 0;
    return coordinate.x.toFixed(precision) + ', ' +
        coordinate.y.toFixed(precision);
  } else {
    return '';
  }
};
