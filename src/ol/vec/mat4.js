goog.provide('ol.vec.Mat4');

goog.require('goog.vec.Mat4');


/**
 * @param {!goog.vec.Mat4.Float32} matrix Matrix.
 * @param {number} value Brightness value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.vec.Mat4.makeBrightness = function(matrix, value) {
  goog.vec.Mat4.makeTranslate(matrix, value, value, value);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Float32} matrix Matrix.
 * @param {number} value Contrast value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.vec.Mat4.makeContrast = function(matrix, value) {
  goog.vec.Mat4.makeScale(matrix, value, value, value);
  var translateValue = (-0.5 * value + 0.5);
  goog.vec.Mat4.setColumnValues(matrix, 3,
      translateValue, translateValue, translateValue, 1);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Float32} matrix Matrix.
 * @param {number} value Hue value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.vec.Mat4.makeHue = function(matrix, value) {
  var cosHue = Math.cos(value);
  var sinHue = Math.sin(value);
  var v00 = 0.213 + cosHue * 0.787 - sinHue * 0.213;
  var v01 = 0.715 - cosHue * 0.715 - sinHue * 0.715;
  var v02 = 0.072 - cosHue * 0.072 + sinHue * 0.928;
  var v03 = 0;
  var v10 = 0.213 - cosHue * 0.213 + sinHue * 0.143;
  var v11 = 0.715 + cosHue * 0.285 + sinHue * 0.140;
  var v12 = 0.072 - cosHue * 0.072 - sinHue * 0.283;
  var v13 = 0;
  var v20 = 0.213 - cosHue * 0.213 - sinHue * 0.787;
  var v21 = 0.715 - cosHue * 0.715 + sinHue * 0.715;
  var v22 = 0.072 + cosHue * 0.928 + sinHue * 0.072;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;
};


/**
 * @param {!goog.vec.Mat4.Float32} matrix Matrix.
 * @param {number} value Saturation value.
 * @return {!goog.vec.Mat4.Float32} Matrix.
 */
ol.vec.Mat4.makeSaturation = function(matrix, value) {
  var v00 = 0.213 + 0.787 * value;
  var v01 = 0.715 - 0.715 * value;
  var v02 = 0.072 - 0.072 * value;
  var v03 = 0;
  var v10 = 0.213 - 0.213 * value;
  var v11 = 0.715 + 0.285 * value;
  var v12 = 0.072 - 0.072 * value;
  var v13 = 0;
  var v20 = 0.213 - 0.213 * value;
  var v21 = 0.715 - 0.715 * value;
  var v22 = 0.072 + 0.928 * value;
  var v23 = 0;
  var v30 = 0;
  var v31 = 0;
  var v32 = 0;
  var v33 = 1;
  goog.vec.Mat4.setFromValues(matrix,
      v00, v10, v20, v30,
      v01, v11, v21, v31,
      v02, v12, v22, v32,
      v03, v13, v23, v33);
  return matrix;
};


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
