import _ol_extent_ from '../../extent';
import _ol_geom_flat_contains_ from '../flat/contains';
import _ol_geom_flat_segments_ from '../flat/segments';
var _ol_geom_flat_intersectsextent_ = {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
_ol_geom_flat_intersectsextent_.lineString = function(flatCoordinates, offset, end, stride, extent) {
  var coordinatesExtent = _ol_extent_.extendFlatCoordinates(
      _ol_extent_.createEmpty(), flatCoordinates, offset, end, stride);
  if (!_ol_extent_.intersects(extent, coordinatesExtent)) {
    return false;
  }
  if (_ol_extent_.containsExtent(extent, coordinatesExtent)) {
    return true;
  }
  if (coordinatesExtent[0] >= extent[0] &&
      coordinatesExtent[2] <= extent[2]) {
    return true;
  }
  if (coordinatesExtent[1] >= extent[1] &&
      coordinatesExtent[3] <= extent[3]) {
    return true;
  }
  return _ol_geom_flat_segments_.forEach(flatCoordinates, offset, end, stride,
      /**
       * @param {ol.Coordinate} point1 Start point.
       * @param {ol.Coordinate} point2 End point.
       * @return {boolean} `true` if the segment and the extent intersect,
       *     `false` otherwise.
       */
      function(point1, point2) {
        return _ol_extent_.intersectsSegment(extent, point1, point2);
      });
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
_ol_geom_flat_intersectsextent_.lineStrings = function(flatCoordinates, offset, ends, stride, extent) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    if (_ol_geom_flat_intersectsextent_.lineString(
        flatCoordinates, offset, ends[i], stride, extent)) {
      return true;
    }
    offset = ends[i];
  }
  return false;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
_ol_geom_flat_intersectsextent_.linearRing = function(flatCoordinates, offset, end, stride, extent) {
  if (_ol_geom_flat_intersectsextent_.lineString(
      flatCoordinates, offset, end, stride, extent)) {
    return true;
  }
  if (_ol_geom_flat_contains_.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[0], extent[1])) {
    return true;
  }
  if (_ol_geom_flat_contains_.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[0], extent[3])) {
    return true;
  }
  if (_ol_geom_flat_contains_.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[2], extent[1])) {
    return true;
  }
  if (_ol_geom_flat_contains_.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[2], extent[3])) {
    return true;
  }
  return false;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
_ol_geom_flat_intersectsextent_.linearRings = function(flatCoordinates, offset, ends, stride, extent) {
  if (!_ol_geom_flat_intersectsextent_.linearRing(
      flatCoordinates, offset, ends[0], stride, extent)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  var i, ii;
  for (i = 1, ii = ends.length; i < ii; ++i) {
    if (_ol_geom_flat_contains_.linearRingContainsExtent(
        flatCoordinates, ends[i - 1], ends[i], stride, extent)) {
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
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
_ol_geom_flat_intersectsextent_.linearRingss = function(flatCoordinates, offset, endss, stride, extent) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    if (_ol_geom_flat_intersectsextent_.linearRings(
        flatCoordinates, offset, ends, stride, extent)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
};
export default _ol_geom_flat_intersectsextent_;
