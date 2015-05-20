goog.provide('ol.geom.flat.orient');

goog.require('ol.geom.flat.reverse');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} Is clockwise.
 */
ol.geom.flat.orient.linearRingIsClockwise =
    function(flatCoordinates, offset, end, stride) {
  // http://tinyurl.com/clockwise-method
  // https://github.com/OSGeo/gdal/blob/trunk/gdal/ogr/ogrlinearring.cpp
  var edge = 0;
  var x1 = flatCoordinates[end - stride];
  var y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    edge += (x2 - x1) * (y2 + y1);
    x1 = x2;
    y1 = y2;
  }
  return edge > 0;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @return {boolean} `true` if all rings are correctly oriented, `false`
 *     otherwise.
 */
ol.geom.flat.orient.linearRingsAreOriented =
    function(flatCoordinates, offset, ends, stride) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(
        flatCoordinates, offset, end, stride);
    if (i === 0 ? !isClockwise : isClockwise) {
      return false;
    }
    offset = end;
  }
  return true;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {boolean} `true` if all rings are correctly oriented, `false`
 *     otherwise.
 */
ol.geom.flat.linearRingssAreOriented =
    function(flatCoordinates, offset, endss, stride) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    if (!ol.geom.flat.orient.linearRingsAreOriented(
        flatCoordinates, offset, endss[i], stride)) {
      return false;
    }
  }
  return true;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @return {number} End.
 */
ol.geom.flat.orient.orientLinearRings =
    function(flatCoordinates, offset, ends, stride) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(
        flatCoordinates, offset, end, stride);
    var reverse = i === 0 ? !isClockwise : isClockwise;
    if (reverse) {
      ol.geom.flat.reverse.coordinates(flatCoordinates, offset, end, stride);
    }
    offset = end;
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {number} End.
 */
ol.geom.flat.orient.orientLinearRingss =
    function(flatCoordinates, offset, endss, stride) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = ol.geom.flat.orient.orientLinearRings(
        flatCoordinates, offset, endss[i], stride);
  }
  return offset;
};
