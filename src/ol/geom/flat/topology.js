goog.provide('ol.geom.flat.topology');

goog.require('ol.geom.flat.area');

/**
 * Check if the linestring is a boundary.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} The linestring is a boundary.
 */
ol.geom.flat.topology.lineStringIsClosed = function(flatCoordinates, offset, end, stride) {
  var lastCoord = end - stride;
  if (flatCoordinates[offset] === flatCoordinates[lastCoord] &&
      flatCoordinates[offset + 1] === flatCoordinates[lastCoord + 1] && (end - offset) / stride > 3) {
    return !!ol.geom.flat.area.linearRing(flatCoordinates, offset, end, stride);
  }
  return false;
};
