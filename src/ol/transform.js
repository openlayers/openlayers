goog.provide('ol.transform');

goog.require('ol.asserts');


/**
 * Collection of affine 2d transformation functions. The functions work on an
 * array of 6 elements. The element order is compatible with the [SVGMatrix
 * interface](https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix) and is
 * a subset (elements a to f) of a 3x3 martrix:
 * ```
 * [ a c e ]
 * [ b d f ]
 * [ 0 0 1 ]
 * ```
 */


/**
 * @private
 * @type {ol.Transform}
 */
ol.transform.tmp_ = new Array(6);


/**
 * Create an identity transform.
 * @return {!ol.Transform} Identity transform.
 */
ol.transform.create = function() {
  return [1, 0, 0, 1, 0, 0];
};


/**
 * Resets the given transform to an identity transform.
 * @param {!ol.Transform} transform Transform.
 * @return {!ol.Transform} Transform.
 */
ol.transform.reset = function(transform) {
  return ol.transform.set(transform, 1, 0, 0, 1, 0, 0);
};


/**
 * Multiply the underlying matrices of two transforms and return the result in
 * the first transform.
 * @param {!ol.Transform} transform1 Transform parameters of matrix 1.
 * @param {!ol.Transform} transform2 Transform parameters of matrix 2.
 * @return {!ol.Transform} transform1 multiplied with transform2.
 */
ol.transform.multiply = function(transform1, transform2) {
  var a1 = transform1[0];
  var b1 = transform1[1];
  var c1 = transform1[2];
  var d1 = transform1[3];
  var e1 = transform1[4];
  var f1 = transform1[5];
  var a2 = transform2[0];
  var b2 = transform2[1];
  var c2 = transform2[2];
  var d2 = transform2[3];
  var e2 = transform2[4];
  var f2 = transform2[5];

  transform1[0] = a1 * a2 + c1 * b2;
  transform1[1] = b1 * a2 + d1 * b2;
  transform1[2] = a1 * c2 + c1 * d2;
  transform1[3] = b1 * c2 + d1 * d2;
  transform1[4] = a1 * e2 + c1 * f2 + e1;
  transform1[5] = b1 * e2 + d1 * f2 + f1;

  return transform1;
};

/**
 * Set the transform components a-f on a given transform.
 * @param {!ol.Transform} transform Transform.
 * @param {number} a The a component of the transform.
 * @param {number} b The b component of the transform.
 * @param {number} c The c component of the transform.
 * @param {number} d The d component of the transform.
 * @param {number} e The e component of the transform.
 * @param {number} f The f component of the transform.
 * @return {!ol.Transform} Matrix with transform applied.
 */
ol.transform.set = function(transform, a, b, c, d, e, f) {
  transform[0] = a;
  transform[1] = b;
  transform[2] = c;
  transform[3] = d;
  transform[4] = e;
  transform[5] = f;
  return transform;
};


/**
 * Set transform on one matrix from another matrix.
 * @param {!ol.Transform} transform1 Matrix to set transform to.
 * @param {!ol.Transform} transform2 Matrix to set transform from.
 * @return {!ol.Transform} transform1 with transform from transform2 applied.
 */
ol.transform.setFromArray = function(transform1, transform2) {
  transform1[0] = transform2[0];
  transform1[1] = transform2[1];
  transform1[2] = transform2[2];
  transform1[3] = transform2[3];
  transform1[4] = transform2[4];
  transform1[5] = transform2[5];
  return transform1;
};


/**
 * Transforms the given coordinate with the given transform returning the
 * resulting, transformed coordinate. The coordinate will be modified in-place.
 *
 * @param {ol.Transform} transform The transformation.
 * @param {ol.Coordinate|ol.Pixel} coordinate The coordinate to transform.
 * @return {ol.Coordinate|ol.Pixel} return coordinate so that operations can be
 *     chained together.
 */
ol.transform.apply = function(transform, coordinate) {
  var x = coordinate[0], y = coordinate[1];
  coordinate[0] = transform[0] * x + transform[2] * y + transform[4];
  coordinate[1] = transform[1] * x + transform[3] * y + transform[5];
  return coordinate;
};


/**
 * Applies rotation to the given transform.
 * @param {!ol.Transform} transform Transform.
 * @param {number} angle Angle in radians.
 * @return {!ol.Transform} The rotated transform.
 */
ol.transform.rotate = function(transform, angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return ol.transform.multiply(transform,
      ol.transform.set(ol.transform.tmp_, cos, sin, -sin, cos, 0, 0));
};


/**
 * Applies scale to a given transform.
 * @param {!ol.Transform} transform Transform.
 * @param {number} x Scale factor x.
 * @param {number} y Scale factor y.
 * @return {!ol.Transform} The scaled transform.
 */
ol.transform.scale = function(transform, x, y) {
  return ol.transform.multiply(transform,
      ol.transform.set(ol.transform.tmp_, x, 0, 0, y, 0, 0));
};


/**
 * Applies translation to the given transform.
 * @param {!ol.Transform} transform Transform.
 * @param {number} dx Translation x.
 * @param {number} dy Translation y.
 * @return {!ol.Transform} The translated transform.
 */
ol.transform.translate = function(transform, dx, dy) {
  return ol.transform.multiply(transform,
      ol.transform.set(ol.transform.tmp_, 1, 0, 0, 1, dx, dy));
};


/**
 * Creates a composite transform given an initial translation, scale, rotation, and
 * final translation (in that order only, not commutative).
 * @param {!ol.Transform} transform The transform (will be modified in place).
 * @param {number} dx1 Initial translation x.
 * @param {number} dy1 Initial translation y.
 * @param {number} sx Scale factor x.
 * @param {number} sy Scale factor y.
 * @param {number} angle Rotation (in counter-clockwise radians).
 * @param {number} dx2 Final translation x.
 * @param {number} dy2 Final translation y.
 * @return {!ol.Transform} The composite transform.
 */
ol.transform.compose = function(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  transform[0] = sx * cos;
  transform[1] = sy * sin;
  transform[2] = -sx * sin;
  transform[3] = sy * cos;
  transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
  transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
  return transform;
};


/**
 * Invert the given transform.
 * @param {!ol.Transform} transform Transform.
 * @return {!ol.Transform} Inverse of the transform.
 */
ol.transform.invert = function(transform) {
  var det = ol.transform.determinant(transform);
  ol.asserts.assert(det !== 0, 32); // Transformation matrix cannot be inverted

  var a = transform[0];
  var b = transform[1];
  var c = transform[2];
  var d = transform[3];
  var e = transform[4];
  var f = transform[5];

  transform[0] = d / det;
  transform[1] = -b / det;
  transform[2] = -c / det;
  transform[3] = a / det;
  transform[4] = (c * f - d * e) / det;
  transform[5] = -(a * f - b * e) / det;

  return transform;
};


/**
 * Returns the determinant of the given matrix.
 * @param {!ol.Transform} mat Matrix.
 * @return {number} Determinant.
 */
ol.transform.determinant = function(mat) {
  return mat[0] * mat[3] - mat[1] * mat[2];
};
