goog.provide('ol.geom.flat.intersectsextent');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.flat.contains');
goog.require('ol.geom.flat.segments');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.Extent} extent Extent.
 * @return {boolean} True if the geometry and the extent intersect.
 */
ol.geom.flat.intersectsextent.lineString =
    function(flatCoordinates, offset, end, stride, extent) {
  var coordinatesExtent = ol.extent.extendFlatCoordinates(
      ol.extent.createEmpty(), flatCoordinates, offset, end, stride);
  if (!ol.extent.intersects(extent, coordinatesExtent)) {
    return false;
  }
  if (ol.extent.containsExtent(extent, coordinatesExtent)) {
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
  return ol.geom.flat.segments.forEach(flatCoordinates, offset, end, stride,
      /**
       * @param {ol.Coordinate} point1 Start point.
       * @param {ol.Coordinate} point2 End point.
       * @return {boolean} `true` if the segment and the extent intersect,
       *     `false` otherwise.
       */
      function(point1, point2) {
        return ol.extent.intersectsSegment(extent, point1, point2);
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
ol.geom.flat.intersectsextent.lineStrings =
    function(flatCoordinates, offset, ends, stride, extent) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    if (ol.geom.flat.intersectsextent.lineString(
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
ol.geom.flat.intersectsextent.linearRing =
    function(flatCoordinates, offset, end, stride, extent) {
  if (ol.geom.flat.intersectsextent.lineString(
      flatCoordinates, offset, end, stride, extent)) {
    return true;
  }
  if (ol.geom.flat.contains.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[0], extent[1])) {
    return true;
  }
  if (ol.geom.flat.contains.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[0], extent[3])) {
    return true;
  }
  if (ol.geom.flat.contains.linearRingContainsXY(
      flatCoordinates, offset, end, stride, extent[2], extent[1])) {
    return true;
  }
  if (ol.geom.flat.contains.linearRingContainsXY(
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
ol.geom.flat.intersectsextent.linearRings =
    function(flatCoordinates, offset, ends, stride, extent) {
  goog.asserts.assert(ends.length > 0, 'ends should not be an empty array');
  if (!ol.geom.flat.intersectsextent.linearRing(
      flatCoordinates, offset, ends[0], stride, extent)) {
    return false;
  }
  if (ends.length === 1) {
    return true;
  }
  var i, ii;
  for (i = 1, ii = ends.length; i < ii; ++i) {
    if (ol.geom.flat.contains.linearRingContainsExtent(
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
ol.geom.flat.intersectsextent.linearRingss =
    function(flatCoordinates, offset, endss, stride, extent) {
  goog.asserts.assert(endss.length > 0, 'endss should not be an empty array');
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    if (ol.geom.flat.intersectsextent.linearRings(
        flatCoordinates, offset, ends, stride, extent)) {
      return true;
    }
    offset = ends[ends.length - 1];
  }
  return false;
};
