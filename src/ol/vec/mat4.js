/**
 * @module ol/vec/mat4
 */

/** @typedef {Array<number>} Mat4 */

/**
 * @return {Mat4} "4x4 matrix representing a 3D identity transform."
 */
export function create() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/**
 * @param {Mat4} mat4 Flattened 4x4 matrix receiving the result.
 * @param {import("../transform.js").Transform} transform Transformation matrix.
 * @return {Mat4} "2D transformation matrix as flattened 4x4 matrix."
 */
export function fromTransform(mat4, transform) {
  mat4[0] = transform[0];
  mat4[1] = transform[1];
  mat4[4] = transform[2];
  mat4[5] = transform[3];
  mat4[12] = transform[4];
  mat4[13] = transform[5];
  return mat4;
}

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @param {Mat4} [out] mat4 frustum matrix will be written into
 * @return {Mat4} out
 */
export function orthographic(left, right, bottom, top, near, far, out) {
  out = out ?? create();
  const lr = 1 / (left - right),
    bt = 1 / (bottom - top),
    nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {Mat4} m The matrix to scale.
 * @param {number} x How much to scale in the x direction.
 * @param {number} y How much to scale in the y direction.
 * @param {number} z How much to scale in the z direction.
 * @param {Mat4} [out] The matrix to write to.
 * @return {Mat4} out
 **/
export function scale(m, x, y, z, out) {
  out = out ?? create();
  out[0] = m[0] * x;
  out[1] = m[1] * x;
  out[2] = m[2] * x;
  out[3] = m[3] * x;
  out[4] = m[4] * y;
  out[5] = m[5] * y;
  out[6] = m[6] * y;
  out[7] = m[7] * y;
  out[8] = m[8] * z;
  out[9] = m[9] * z;
  out[10] = m[10] * z;
  out[11] = m[11] * z;
  out[12] = m[12];
  out[13] = m[13];
  out[14] = m[14];
  out[15] = m[15];
  return out;
}

/**
 * Translate a matrix.
 *
 * @param {Mat4} m the matrix to translate
 * @param {number} x How much to translate in the x direction.
 * @param {number} y How much to translate in the y direction.
 * @param {number} z How much to translate in the z direction.
 * @param {Mat4} [out] the receiving matrix
 * @return {Mat4} out
 */
export function translate(m, x, y, z, out) {
  out = out ?? create();
  let a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23;

  if (m === out) {
    out[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
    out[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
  } else {
    a00 = m[0];
    a01 = m[1];
    a02 = m[2];
    a03 = m[3];
    a10 = m[4];
    a11 = m[5];
    a12 = m[6];
    a13 = m[7];
    a20 = m[8];
    a21 = m[9];
    a22 = m[10];
    a23 = m[11];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;

    out[12] = a00 * x + a10 * y + a20 * z + m[12];
    out[13] = a01 * x + a11 * y + a21 * z + m[13];
    out[14] = a02 * x + a12 * y + a22 * z + m[14];
    out[15] = a03 * x + a13 * y + a23 * z + m[15];
  }

  return out;
}

/**
 * @param {number} x x translation.
 * @param {number} y y translation.
 * @param {number} z z translation.
 * @param {Mat4} [out] optional matrix to store result
 * @return {Mat4} out
 */
export function translation(x, y, z, out) {
  out = out ?? create();

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = x;
  out[13] = y;
  out[14] = z;
  out[15] = 1;

  return out;
}
