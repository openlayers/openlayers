goog.provide('ol.geom2');

goog.require('goog.asserts');
goog.require('ol.Extent');


/**
 * @param {ol.structs.Buffer} buf Buffer.
 * @param {number} dim Dimension.
 * @return {ol.Extent} Extent.
 */
ol.geom2.getExtent = function(buf, dim) {
  var extent = new Array(2 * dim);
  var extentIndex = 0;
  var i;
  for (i = 0; i < dim; ++i) {
    extent[extentIndex++] = Infinity;
    extent[extentIndex++] = -Infinity;
  }
  var bufArr = buf.getArray();
  buf.forEachRange(function(start, stop) {
    var extentIndex, i, j;
    for (i = start; i < stop; i += dim) {
      extentIndex = 0;
      for (j = 0; j < dim; ++j) {
        extent[extentIndex++] = Math.min(extent[2 * j], bufArr[i + j]);
        extent[extentIndex++] = Math.max(extent[2 * j + 1], bufArr[i + j]);
      }
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
