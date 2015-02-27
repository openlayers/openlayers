goog.provide('ol.geom.flat.splice');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.geom.flat.deflate');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} stride Stride.
 * @param {number} start Start.
 * @param {number} deleteCount Delete Count.
 * @param {Array.<ol.Coordinate>=} opt_coordinates Coordinates.
 */
ol.geom.flat.splice.coordinates =
    function(flatCoordinates, stride, start, deleteCount, opt_coordinates) {
  var newFlatCoordinates = [];
  if (goog.isDef(opt_coordinates)) {
    ol.geom.flat.deflate.coordinates(
        newFlatCoordinates, 0, opt_coordinates, stride);
    goog.asserts.assert(
        newFlatCoordinates.length == opt_coordinates.length * stride);
  }
  goog.partial(goog.array.splice, flatCoordinates, start * stride,
      deleteCount * stride).apply(null, newFlatCoordinates);
};
