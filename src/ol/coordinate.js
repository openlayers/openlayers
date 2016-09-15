goog.provide('ol.coordinate');

goog.require('ol.math');
goog.require('ol.string');


/**
 * Add `delta` to `coordinate`. `coordinate` is modified in place and returned
 * by the function.
 *
 * Example:
 *
 *     var coord = [7.85, 47.983333];
 *     ol.coordinate.add(coord, [-2, 4]);
 *     // coord is now [5.85, 51.983333]
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate} The input coordinate adjusted by the given delta.
 * @api stable
 */
ol.coordinate.add = function(coordinate, delta) {
  coordinate[0] += delta[0];
  coordinate[1] += delta[1];
  return coordinate;
};


/**
 * Calculates the point closest to the passed coordinate on the passed segment.
 * This is the foot of the perpendicular of the coordinate to the segment when
 * the foot is on the segment, or the closest segment coordinate when the foot
 * is outside the segment.
 *
 * @param {ol.Coordinate} coordinate The coordinate.
 * @param {Array.<ol.Coordinate>} segment The two coordinates of the segment.
 * @return {ol.Coordinate} The foot of the perpendicular of the coordinate to
 *     the segment.
 */
ol.coordinate.closestOnSegment = function(coordinate, segment) {
  var x0 = coordinate[0];
  var y0 = coordinate[1];
  var start = segment[0];
  var end = segment[1];
  var x1 = start[0];
  var y1 = start[1];
  var x2 = end[0];
  var y2 = end[1];
  var dx = x2 - x1;
  var dy = y2 - y1;
  var along = (dx === 0 && dy === 0) ? 0 :
      ((dx * (x0 - x1)) + (dy * (y0 - y1))) / ((dx * dx + dy * dy) || 0);
  var x, y;
  if (along <= 0) {
    x = x1;
    y = y1;
  } else if (along >= 1) {
    x = x2;
    y = y2;
  } else {
    x = x1 + along * dx;
    y = y1 + along * dy;
  }
  return [x, y];
};


/**
 * Returns a {@link ol.CoordinateFormatType} function that can be used to format
 * a {ol.Coordinate} to a string.
 *
 * Example without specifying the fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var stringifyFunc = ol.coordinate.createStringXY();
 *     var out = stringifyFunc(coord);
 *     // out is now '8, 48'
 *
 * Example with explicitly specifying 2 fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var stringifyFunc = ol.coordinate.createStringXY(2);
 *     var out = stringifyFunc(coord);
 *     // out is now '7.85, 47.98'
 *
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {ol.CoordinateFormatType} Coordinate format.
 * @api stable
 */
ol.coordinate.createStringXY = function(opt_fractionDigits) {
  return (
      /**
       * @param {ol.Coordinate|undefined} coordinate Coordinate.
       * @return {string} String XY.
       */
      function(coordinate) {
        return ol.coordinate.toStringXY(coordinate, opt_fractionDigits);
      });
};


/**
 * @private
 * @param {number} degrees Degrees.
 * @param {string} hemispheres Hemispheres.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} String.
 */
ol.coordinate.degreesToStringHDMS_ = function(degrees, hemispheres, opt_fractionDigits) {
  var normalizedDegrees = ol.math.modulo(degrees + 180, 360) - 180;
  var x = Math.abs(3600 * normalizedDegrees);
  var dflPrecision = opt_fractionDigits || 0;
  return Math.floor(x / 3600) + '\u00b0 ' +
      ol.string.padNumber(Math.floor((x / 60) % 60), 2) + '\u2032 ' +
      ol.string.padNumber((x % 60), 2, dflPrecision) + '\u2033 ' +
      hemispheres.charAt(normalizedDegrees < 0 ? 1 : 0);
};


/**
 * Transforms the given {@link ol.Coordinate} to a string using the given string
 * template. The strings `{x}` and `{y}` in the template will be replaced with
 * the first and second coordinate values respectively.
 *
 * Example without specifying the fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var template = 'Coordinate is ({x}|{y}).';
 *     var out = ol.coordinate.format(coord, template);
 *     // out is now 'Coordinate is (8|48).'
 *
 * Example explicitly specifying the fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var template = 'Coordinate is ({x}|{y}).';
 *     var out = ol.coordinate.format(coord, template, 2);
 *     // out is now 'Coordinate is (7.85|47.98).'
 *
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @param {string} template A template string with `{x}` and `{y}` placeholders
 *     that will be replaced by first and second coordinate values.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} Formatted coordinate.
 * @api stable
 */
ol.coordinate.format = function(coordinate, template, opt_fractionDigits) {
  if (coordinate) {
    return template
      .replace('{x}', coordinate[0].toFixed(opt_fractionDigits))
      .replace('{y}', coordinate[1].toFixed(opt_fractionDigits));
  } else {
    return '';
  }
};


/**
 * @param {ol.Coordinate} coordinate1 First coordinate.
 * @param {ol.Coordinate} coordinate2 Second coordinate.
 * @return {boolean} Whether the passed coordinates are equal.
 */
ol.coordinate.equals = function(coordinate1, coordinate2) {
  var equals = true;
  for (var i = coordinate1.length - 1; i >= 0; --i) {
    if (coordinate1[i] != coordinate2[i]) {
      equals = false;
      break;
    }
  }
  return equals;
};


/**
 * Rotate `coordinate` by `angle`. `coordinate` is modified in place and
 * returned by the function.
 *
 * Example:
 *
 *     var coord = [7.85, 47.983333];
 *     var rotateRadians = Math.PI / 2; // 90 degrees
 *     ol.coordinate.rotate(coord, rotateRadians);
 *     // coord is now [-47.983333, 7.85]
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} angle Angle in radian.
 * @return {ol.Coordinate} Coordinate.
 * @api stable
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
 * Scale `coordinate` by `scale`. `coordinate` is modified in place and returned
 * by the function.
 *
 * Example:
 *
 *     var coord = [7.85, 47.983333];
 *     var scale = 1.2;
 *     ol.coordinate.scale(coord, scale);
 *     // coord is now [9.42, 57.5799996]
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} scale Scale factor.
 * @return {ol.Coordinate} Coordinate.
 */
ol.coordinate.scale = function(coordinate, scale) {
  coordinate[0] *= scale;
  coordinate[1] *= scale;
  return coordinate;
};


/**
 * Subtract `delta` to `coordinate`. `coordinate` is modified in place and
 * returned by the function.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate} Coordinate.
 */
ol.coordinate.sub = function(coordinate, delta) {
  coordinate[0] -= delta[0];
  coordinate[1] -= delta[1];
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
 * Calculate the squared distance from a coordinate to a line segment.
 *
 * @param {ol.Coordinate} coordinate Coordinate of the point.
 * @param {Array.<ol.Coordinate>} segment Line segment (2 coordinates).
 * @return {number} Squared distance from the point to the line segment.
 */
ol.coordinate.squaredDistanceToSegment = function(coordinate, segment) {
  return ol.coordinate.squaredDistance(coordinate,
      ol.coordinate.closestOnSegment(coordinate, segment));
};


/**
 * Format a geographic coordinate with the hemisphere, degrees, minutes, and
 * seconds.
 *
 * Example without specifying fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var out = ol.coordinate.toStringHDMS(coord);
 *     // out is now '47° 58′ 60″ N 7° 50′ 60″ E'
 *
 * Example explicitly specifying 1 fractional digit:
 *
 *     var coord = [7.85, 47.983333];
 *     var out = ol.coordinate.toStringHDMS(coord, 1);
 *     // out is now '47° 58′ 60.0″ N 7° 50′ 60.0″ E'
 *
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} Hemisphere, degrees, minutes and seconds.
 * @api stable
 */
ol.coordinate.toStringHDMS = function(coordinate, opt_fractionDigits) {
  if (coordinate) {
    return ol.coordinate.degreesToStringHDMS_(coordinate[1], 'NS', opt_fractionDigits) + ' ' +
        ol.coordinate.degreesToStringHDMS_(coordinate[0], 'EW', opt_fractionDigits);
  } else {
    return '';
  }
};


/**
 * Format a coordinate as a comma delimited string.
 *
 * Example without specifying fractional digits:
 *
 *     var coord = [7.85, 47.983333];
 *     var out = ol.coordinate.toStringXY(coord);
 *     // out is now '8, 48'
 *
 * Example explicitly specifying 1 fractional digit:
 *
 *     var coord = [7.85, 47.983333];
 *     var out = ol.coordinate.toStringXY(coord, 1);
 *     // out is now '7.8, 48.0'
 *
 * @param {ol.Coordinate|undefined} coordinate Coordinate.
 * @param {number=} opt_fractionDigits The number of digits to include
 *    after the decimal point. Default is `0`.
 * @return {string} XY.
 * @api stable
 */
ol.coordinate.toStringXY = function(coordinate, opt_fractionDigits) {
  return ol.coordinate.format(coordinate, '{x}, {y}', opt_fractionDigits);
};
