goog.provide('ol.geom2');

goog.require('goog.asserts');
goog.require('ol.Extent');
goog.require('ol.extent');


/**
 * @param {ol.structs.Buffer} buf Buffer.
 * @param {number} dim Dimension.
 * @return {ol.Extent} Extent.
 */
ol.geom2.getExtent = function(buf, dim) {
  var extent = ol.extent.createEmpty();
  var bufArr = buf.getArray();
  buf.forEachRange(function(start, stop) {
    var x, y;
    for (var i = start; i < stop; i += dim) {
      x = bufArr[i];
      y = bufArr[i + 1];
      extent[0] = Math.min(extent[0], x);
      extent[1] = Math.min(extent[1], y);
      extent[2] = Math.max(extent[2], x);
      extent[3] = Math.max(extent[3], y);
    }
  });
  return extent;
};


/**
 * @param {Array.<number>} arr Array.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} unpackedPoints Unpacked points.
 * @param {number} dim Dimension.
 * @return {number} Offset.
 */
ol.geom2.packPoints = function(arr, offset, unpackedPoints, dim) {
  var n = unpackedPoints.length;
  var i, j, point;
  for (i = 0; i < n; ++i) {
    point = unpackedPoints[i];
    goog.asserts.assert(point.length == dim);
    for (j = 0; j < dim; ++j) {
      arr[offset++] = point[j];
    }
  }
  return offset;
};


/**
 * @param {Array.<number>} arr Array.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} dim Dimension.
 * @return {Array.<Array.<number>>} Unpacked points.
 */
ol.geom2.unpackPoints = function(arr, offset, end, dim) {
  var unpackedPoints = new Array((end - offset) / dim);
  var i = 0;
  var j;
  for (j = offset; j < end; j += dim) {
    unpackedPoints[i++] = arr.slice(j, j + dim);
  }
  return unpackedPoints;
};
