goog.provide('ol.matrix');

/**
 * Collection of matrix transformation functions. The element order is
 * compatible with the [SVGMatrix interface](https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix):
 * ```
 * [ a c e ]
 * [ b d f ]
 * [ 0 0 1 ]
 * ```
 */


/**
 * Create an identity matrix.
 * @return {!ol.Matrix} Identity matrix.
 */
ol.matrix.create = function() {
  return [1, 0, 0, 1, 0, 0];
};


/**
 * Check if two matrices are equal.
 * @param {!ol.Matrix} mat1 Matrix 1.
 * @param {!ol.Matrix} mat2 Matrix 2.
 * @return {boolean} Matrix 1 and Matrix 2 are equal.
 */
ol.matrix.equals = function(mat1, mat2) {
  return mat1[0] == mat2[0] &&
      mat1[1] == mat2[1] &&
      mat1[2] == mat2[2] &&
      mat1[3] == mat2[3] &&
      mat1[4] == mat2[4] &&
      mat1[5] == mat2[5];
};


/**
 * Resets the given matrix to an identity matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @return {!ol.Matrix} Matrix.
 */
ol.matrix.makeIdentity = function(mat) {
  return ol.matrix.setTransform(mat, 1, 0, 0, 1, 0, 0);
};


/**
 * Multiply two matrices with each other.
 * @param {!ol.Matrix} mat1 Matrix 1.
 * @param {!ol.Matrix} mat2 Matrix 2.
 * @param {ol.Matrix=} opt_mat Optional matrix for the result.
 * @return {!ol.Matrix} Result matrix.
 */
ol.matrix.multiply = function(mat1, mat2, opt_mat) {
  var mat = opt_mat ? opt_mat : ol.matrix.create();
  ol.matrix.setTransform(mat, mat1[0], mat1[1], mat1[2], mat1[3], mat1[4], mat1[5]);
  return ol.matrix.transform(mat, mat2[0], mat2[1], mat2[2], mat2[3], mat2[4], mat2[5]);
};

/**
 * Set the transform for a given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} a The a component of the matrix.
 * @param {number} b The b component of the matrix.
 * @param {number} c The c component of the matrix.
 * @param {number} d The d component of the matrix.
 * @param {number} e The e component of the matrix.
 * @param {number} f The f component of the matrix.
 * @return {!ol.Matrix} Matrix with transform applied.
 */
ol.matrix.setTransform = function(mat, a, b, c, d, e, f) {
  mat[0] = a;
  mat[1] = b;
  mat[2] = c;
  mat[3] = d;
  mat[4] = e;
  mat[5] = f;
  return mat;
};


/**
 * Set transform on one matrix from another matrix.
 * @param {!ol.Matrix} mat1 Matrix to set transform to.
 * @param {!ol.Matrix} mat2 Matrix to set transform from.
 * @return {!ol.Matrix} mat1 with transform from mat2 applied.
 */
ol.matrix.setFromArray = function(mat1, mat2) {
  mat1[0] = mat2[0];
  mat1[1] = mat2[1];
  mat1[2] = mat2[2];
  mat1[3] = mat2[3];
  mat1[4] = mat2[4];
  mat1[5] = mat2[5];
  return mat1;
};


/**
 * Rotates the given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} rotation Angle in radians.
 * @return {!ol.Matrix} Rotated matrix.
 */
ol.matrix.rotate = function(mat, rotation) {
  var cos = Math.cos(rotation);
  var sin = Math.sin(rotation);
  return ol.matrix.transform(mat, cos, sin, -sin, cos, 0, 0);
};


/**
 * Multiplies the given matrix with new matrix values.
 * @see {@link ol.Matrix#multiply}.
 *
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} a The a component of the matrix.
 * @param {number} b The b component of the matrix.
 * @param {number} c The c component of the matrix.
 * @param {number} d The d component of the matrix.
 * @param {number} e The e component of the matrix.
 * @param {number} f The f component of the matrix.
 * @return {!ol.Matrix} Transformed matrix.
 */
ol.matrix.transform = function(mat, a, b, c, d, e, f) {
  var matA = mat[0];
  var matB = mat[1];
  var matC = mat[2];
  var matD = mat[3];
  var matE = mat[4];
  var matF = mat[5];

  mat[0] = matA * a + matC * b;
  mat[1] = matB * a + matD * b;
  mat[2] = matA * c + matC * d;
  mat[3] = matB * c + matD * d;
  mat[4] = matA * e + matC * f + matE;
  mat[5] = matB * e + matD * f + matF;

  return mat;
};


/**
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} translateX1 Translate X1.
 * @param {number} translateY1 Translate Y1.
 * @param {number} scaleX Scale X.
 * @param {number} scaleY Scale Y.
 * @param {number} rotation Rotation.
 * @param {number} translateX2 Translate X2.
 * @param {number} translateY2 Translate Y2.
 * @return {!ol.Matrix} Matrix.
 */
ol.matrix.makeTransform = function(mat, translateX1, translateY1,
    scaleX, scaleY, rotation, translateX2, translateY2) {
  ol.matrix.makeIdentity(mat);
  if (translateX1 !== 0 || translateY1 !== 0) {
    ol.matrix.translate(mat, translateX1, translateY1);
  }
  if (scaleX != 1 || scaleY != 1) {
    ol.matrix.scale(mat, scaleX, scaleY);
  }
  if (rotation !== 0) {
    ol.matrix.rotate(mat, rotation);
  }
  if (translateX2 !== 0 || translateY2 !== 0) {
    ol.matrix.translate(mat, translateX2, translateY2);
  }
  return mat;
};


/**
 * Transforms the given vector with the given matrix storing the resulting,
 * transformed vector into resultVec.
 *
 * @param {ol.Matrix} mat The matrix supplying the transformation.
 * @param {Array.<number>} vec The 2 element vector to transform.
 * @param {Array.<number>} resultVec The 2 element vector to receive the results
 *     (may be vec).
 * @return {Array.<number>} return resultVec so that operations can be
 *     chained together.
 */
ol.matrix.multVec2 = function(mat, vec, resultVec) {
  var x = vec[0], y = vec[1];
  resultVec[0] = mat[0] * x + mat[2] * y + mat[4];
  resultVec[1] = mat[1] * x + mat[3] * y + mat[5];
  return resultVec;
};


/**
 * Scales the given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} sx Scale factor x.
 * @param {number} sy Scale factor y.
 * @return {!ol.Matrix} The scaled matrix.
 */
ol.matrix.scale = function(mat, sx, sy) {
  return ol.matrix.transform(mat, sx, 0, 0, sy, 0, 0);
};


/**
 * Translate the given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @param {number} tx Translation x.
 * @param {number} ty Translation y.
 * @return {!ol.Matrix} The translated matrix.
 */
ol.matrix.translate = function(mat, tx, ty) {
  return ol.matrix.transform(mat, 1, 0, 0, 1, tx, ty);
};


/**
 * Invert the given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @param {ol.Matrix=} opt_mat Optional matrix for the result.
 * @return {!ol.Matrix} Inverse of the matrix.
 */
ol.matrix.invert = function(mat, opt_mat) {
  var result = opt_mat ? opt_mat : ol.matrix.create();
  var det = ol.matrix.determinant(mat);
  goog.asserts.assert(det !== 0, 'Matrix cannot be inverted.');

  result[0] = mat[3] / det;
  result[1] = -mat[1] / det;
  result[2] = -mat[2] / det;
  result[3] = mat[0] / det;
  result[4] = (mat[2] * mat[5] - mat[3] * mat[4]) / det;
  result[5] = -(mat[0] * mat[5] - mat[1] * mat[4]) / det;
  return result;
};


/**
 * Returns the determinant of the given matrix.
 * @param {!ol.Matrix} mat Matrix.
 * @return {number} Determinant.
 */
ol.matrix.determinant = function(mat) {
  return mat[0] * mat[3] - mat[1] * mat[2];
};
