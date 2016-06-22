goog.provide('ol.vec.Mat4');


/**
 * @type {Array.<number>}
 */
ol.vec.Mat4.tmpMatrix_ = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];


/**
 * @param {ol.Transform} mat Transformation matrix.
 * @return {Array.<number>} 2D transformation matrix as flattened 4x4 matrix.
 */
ol.vec.Mat4.fromMatrix = function(mat) {
  var mat4 = ol.vec.Mat4.tmpMatrix_;
  mat4[0] = mat[0];
  mat4[1] = mat[1];
  mat4[4] = mat[2];
  mat4[5] = mat[3];
  mat4[12] = mat[4];
  mat4[13] = mat[5];
  return mat4;
};
