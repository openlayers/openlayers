goog.provide('ol.replay');

goog.require('goog.vec.Mat4');


/**
 * @param {Array.<number>} path Path.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Pixel path.
 */
ol.replay.transformPath = function(path, transform, opt_dest) {
  var m00 = goog.vec.Mat4.getElement(transform, 0, 0);
  var m10 = goog.vec.Mat4.getElement(transform, 1, 0);
  var m01 = goog.vec.Mat4.getElement(transform, 0, 1);
  var m11 = goog.vec.Mat4.getElement(transform, 1, 1);
  var m03 = goog.vec.Mat4.getElement(transform, 0, 3);
  var m13 = goog.vec.Mat4.getElement(transform, 1, 3);
  var n = path.length;
  var result;
  if (goog.isDef(opt_dest)) {
    result = opt_dest;
  } else {
    result = new Array(n);
  }
  var j = 0;
  var i, x, y;
  for (i = 0; i < n; ) {
    x = path[i++];
    y = path[i++];
    result[j++] = m00 * x + m01 * y + m03;
    result[j++] = m10 * x + m11 * y + m13;
  }
  if (goog.isDef(opt_dest) && result.length != j) {
    result.length = j;
  }
  return result;
};
