import _ol_extent_ from '../../extent';
var _ol_geom_flat_contains_ = {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} Contains extent.
 */
_ol_geom_flat_contains_.linearRingContainsExtent = function(flatCoordinates, offset, end, stride, extent) {
  var outside = _ol_extent_.forEachCorner(extent,
      /**
       * @param {ol.Coordinate} coordinate Coordinate.
       * @return {boolean} Contains (x, y).
       */
      function(coordinate) {
        return !_ol_geom_flat_contains_.linearRingContainsXY(flatCoordinates,
            offset, end, stride, coordinate[0], coordinate[1]);
      });
  return !outside;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
_ol_geom_flat_contains_.linearRingContainsXY = function(flatCoordinates, offset, end, stride, x, y) {
  // http://geomalgorithms.com/a03-_inclusion.html
  // Copyright 2000 softSurfer, 2012 Dan Sunday
  // This code may be freely used and modified for any purpose
  // providing that this copyright notice is included with it.
  // SoftSurfer makes no warranty for this code, and cannot be held
  // liable for any real or imagined damage resulting from its use.
  // Users of this code must verify correctness for their application.
  var wn = 0;
  var x1 = flatCoordinates[end - stride];
  var y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    if (y1 <= y) {
      if (y2 > y && ((x2 - x1) * (y - y1)) - ((x - x1) * (y2 - y1)) > 0) {
        wn++;
      }
    } else if (y2 <= y && ((x2 - x1) * (y - y1)) - ((x - x1) * (y2 - y1)) < 0) {
      wn--;
    }
    x1 = x2;
    y1 = y2;
  }
  return wn !== 0;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
_ol_geom_flat_contains_.linearRingsContainsXY = function(flatCoordinates, offset, ends, stride, x, y) {
  if (ends.length === 0) {
    return false;
  }
  if (!_ol_geom_flat_contains_.linearRingContainsXY(
      flatCoordinates, offset, ends[0], stride, x, y)) {
    return false;
  }
  var i, ii;
  for (i = 1, ii = ends.length; i < ii; ++i) {
    if (_ol_geom_flat_contains_.linearRingContainsXY(
        flatCoordinates, ends[i - 1], ends[i], stride, x, y)) {
      return false;
    }
  }
  return true;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
_ol_geom_flat_contains_.linearRingssContainsXY = function(flatCoordinates, offset, endss, stride, x, y) {
  if (endss.length === 0) {
    return false;
  }
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    if (_ol_geom_flat_contains_.linearRingsContainsXY(
        flatCoordinates, offset, ends, stride, x, y)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
};
export default _ol_geom_flat_contains_;
