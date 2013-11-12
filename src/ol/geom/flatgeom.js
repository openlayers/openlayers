goog.provide('ol.geom.flat');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.geom.Geometry');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {number} stride Stride.
 * @return {number} offset Offset.
 */
ol.geom.flat.deflateCoordinates =
    function(flatCoordinates, offset, coordinates, stride) {
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    var coordinate = coordinates[i];
    goog.asserts.assert(coordinate.length == stride);
    var j;
    for (j = 0; j < stride; ++j) {
      flatCoordinates[offset++] = coordinate[j];
    }
  }
  return offset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<ol.Coordinate>>} coordinatess Coordinatess.
 * @param {number} stride Stride.
 * @param {Array.<number>=} opt_ends Ends.
 * @return {Array.<number>} Ends.
 */
ol.geom.flat.deflateCoordinatess =
    function(flatCoordinates, offset, coordinatess, stride, opt_ends) {
  var ends = goog.isDef(opt_ends) ? opt_ends : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = coordinatess.length; j < jj; ++j) {
    var end = ol.geom.flat.deflateCoordinates(
        flatCoordinates, offset, coordinatess[j], stride);
    ends[i++] = end;
    offset = end;
  }
  ends.length = i;
  return ends;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} coordinatesss Coordinatesss.
 * @param {number} stride Stride.
 * @param {Array.<Array.<number>>=} opt_endss Endss.
 * @return {Array.<Array.<number>>} Endss.
 */
ol.geom.flat.deflateCoordinatesss =
    function(flatCoordinates, offset, coordinatesss, stride, opt_endss) {
  var endss = goog.isDef(opt_endss) ? opt_endss : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = coordinatesss.length; j < jj; ++j) {
    var ends = ol.geom.flat.deflateCoordinatess(
        flatCoordinates, offset, coordinatesss[j], stride, endss[i]);
    endss[i++] = ends;
    offset = ends[ends.length - 1];
  }
  return endss;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} stride Stride.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed coordinates.
 */
ol.geom.flat.transform2D =
    function(flatCoordinates, stride, transform, opt_dest) {
  var m00 = goog.vec.Mat4.getElement(transform, 0, 0);
  var m10 = goog.vec.Mat4.getElement(transform, 1, 0);
  var m01 = goog.vec.Mat4.getElement(transform, 0, 1);
  var m11 = goog.vec.Mat4.getElement(transform, 1, 1);
  var m03 = goog.vec.Mat4.getElement(transform, 0, 3);
  var m13 = goog.vec.Mat4.getElement(transform, 1, 3);
  var dest = goog.isDef(opt_dest) ? opt_dest : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = flatCoordinates.length; j < jj; j += stride) {
    var x = flatCoordinates[j];
    var y = flatCoordinates[j + 1];
    dest[i++] = m00 * x + m01 * y + m03;
    dest[i++] = m10 * x + m11 * y + m13;
  }
  if (goog.isDef(opt_dest) && dest.length != i) {
    dest.length = i;
  }
  return dest;
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed flat coordinates.
 */
ol.geom.flat.transformGeometry2D = function(geometry, transform, opt_dest) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  return ol.geom.flat.transform2D(
      flatCoordinates, stride, transform, opt_dest);
};
