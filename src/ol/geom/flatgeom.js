goog.provide('ol.geom.flat');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.extent');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array.<number>=} opt_dest Destination.
 * @param {number=} opt_destOffset Destination offset.
 * @return {Array.<number>} Flat coordinates.
 */
ol.geom.flat.flipXY =
    function(flatCoordinates, offset, end, stride, opt_dest, opt_destOffset) {
  var dest, destOffset;
  if (goog.isDef(opt_dest)) {
    dest = opt_dest;
    destOffset = goog.isDef(opt_destOffset) ? opt_destOffset : 0;
  } else {
    goog.asserts.assert(!goog.isDef(opt_destOffset));
    dest = [];
    destOffset = 0;
  }
  var j, k;
  for (j = offset; j < end; ) {
    var x = flatCoordinates[j++];
    dest[destOffset++] = flatCoordinates[j++];
    dest[destOffset++] = x;
    for (k = 2; k < stride; ++k) {
      dest[destOffset++] = flatCoordinates[j++];
    }
  }
  dest.length = destOffset;
  return dest;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array.<ol.Coordinate>=} opt_coordinates Coordinates.
 * @return {Array.<ol.Coordinate>} Coordinates.
 */
ol.geom.flat.inflateCoordinates =
    function(flatCoordinates, offset, end, stride, opt_coordinates) {
  var coordinates = goog.isDef(opt_coordinates) ? opt_coordinates : [];
  var i = 0;
  var j;
  for (j = offset; j < end; j += stride) {
    coordinates[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates.length = i;
  return coordinates;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array.<Array.<ol.Coordinate>>=} opt_coordinatess Coordinatess.
 * @return {Array.<Array.<ol.Coordinate>>} Coordinatess.
 */
ol.geom.flat.inflateCoordinatess =
    function(flatCoordinates, offset, ends, stride, opt_coordinatess) {
  var coordinatess = goog.isDef(opt_coordinatess) ? opt_coordinatess : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = ends.length; j < jj; ++j) {
    var end = ends[j];
    coordinatess[i++] = ol.geom.flat.inflateCoordinates(
        flatCoordinates, offset, end, stride, coordinatess[i]);
    offset = end;
  }
  coordinatess.length = i;
  return coordinatess;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {Array.<Array.<Array.<ol.Coordinate>>>=} opt_coordinatesss
 *     Coordinatesss.
 * @return {Array.<Array.<Array.<ol.Coordinate>>>} Coordinatesss.
 */
ol.geom.flat.inflateCoordinatesss =
    function(flatCoordinates, offset, endss, stride, opt_coordinatesss) {
  var coordinatesss = goog.isDef(opt_coordinatesss) ? opt_coordinatesss : [];
  var i = 0;
  var j, jj;
  for (j = 0, jj = endss.length; j < jj; ++j) {
    var ends = endss[j];
    coordinatesss[i++] = ol.geom.flat.inflateCoordinatess(
        flatCoordinates, offset, ends, stride, coordinatesss[i]);
    offset = ends[ends.length - 1];
  }
  coordinatesss.length = i;
  return coordinatesss;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {Array.<number>} Flat centers.
 */
ol.geom.flat.linearRingssGetFlatCenters =
    function(flatCoordinates, offset, endss, stride) {
  var flatCenters = [];
  var i, ii;
  var extent = ol.extent.createEmpty();
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    extent = ol.extent.createOrUpdateFromFlatCoordinates(
        flatCoordinates, offset, ends[0], stride);
    flatCenters.push((extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2);
    offset = ends[ends.length - 1];
  }
  return flatCenters;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
ol.geom.flat.reverseCoordinates =
    function(flatCoordinates, offset, end, stride) {
  while (offset < end - stride) {
    var i;
    for (i = 0; i < stride; ++i) {
      var tmp = flatCoordinates[offset + i];
      flatCoordinates[offset + i] = flatCoordinates[end - stride + i];
      flatCoordinates[end - stride + i] = tmp;
    }
    offset += stride;
    end -= stride;
  }
};


/**
 * Returns the square of the closest distance between the point (x, y) and the
 * line segment (x1, y1) to (x2, y2).
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} x1 X1.
 * @param {number} y1 Y1.
 * @param {number} x2 X2.
 * @param {number} y2 Y2.
 * @return {number} Squared distance.
 */
ol.geom.flat.squaredSegmentDistance = function(x, y, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  if (dx !== 0 || dy !== 0) {
    var t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }
  return ol.geom.flat.squaredDistance(x, y, x1, y1);
};


/**
 * Returns the square of the distance between the points (x1, y1) and (x2, y2).
 * @param {number} x1 X1.
 * @param {number} y1 Y1.
 * @param {number} x2 X2.
 * @param {number} y2 Y2.
 * @return {number} Squared distance.
 */
ol.geom.flat.squaredDistance = function(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return dx * dx + dy * dy;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} stride Stride.
 * @param {goog.vec.Mat4.Number} transform Transform.
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
