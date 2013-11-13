goog.provide('ol.vec.Mat4');

goog.require('goog.vec.Mat4');


/**
 * Transforms the given vector with the given matrix storing the resulting,
 * transformed vector into resultVec. The input vector is multiplied against the
 * upper 2x4 matrix omitting the projective component.
 *
 * @param {goog.vec.Mat4.AnyType} mat The matrix supplying the transformation.
 * @param {Array.<number>} vec The 3 element vector to transform.
 * @param {Array.<number>} resultVec The 3 element vector to receive the results
 *     (may be vec).
 * @return {Array.<number>} return resultVec so that operations can be
 *     chained together.
 */
ol.vec.Mat4.multVec2 = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1];
  resultVec[0] = x * mat[0] + y * mat[4] + mat[12];
  resultVec[1] = x * mat[1] + y * mat[5] + mat[13];
  return resultVec;
};
