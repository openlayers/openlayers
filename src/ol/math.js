/**
 * @module ol/math
 */

/**
 * Takes a number and clamps it to within the provided bounds.
 * @param {number} value The input number.
 * @param {number} min The minimum value to return.
 * @param {number} max The maximum value to return.
 * @return {number} The input number if it is within bounds, or the nearest
 *     number within the bounds.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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
export function squaredSegmentDistance(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx !== 0 || dy !== 0) {
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }
  return squaredDistance(x, y, x1, y1);
}

/**
 * Returns the square of the distance between the points (x1, y1) and (x2, y2).
 * @param {number} x1 X1.
 * @param {number} y1 Y1.
 * @param {number} x2 X2.
 * @param {number} y2 Y2.
 * @return {number} Squared distance.
 */
export function squaredDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Solves system of linear equations using Gaussian elimination method.
 *
 * @param {Array<Array<number>>} mat Augmented matrix (n x n + 1 column)
 *                                     in row-major order.
 * @return {Array<number>} The resulting vector.
 */
export function solveLinearSystem(mat) {
  const n = mat.length;

  for (let i = 0; i < n; i++) {
    // Find max in the i-th column (ignoring i - 1 first rows)
    let maxRow = i;
    let maxEl = Math.abs(mat[i][i]);
    for (let r = i + 1; r < n; r++) {
      const absValue = Math.abs(mat[r][i]);
      if (absValue > maxEl) {
        maxEl = absValue;
        maxRow = r;
      }
    }

    if (maxEl === 0) {
      return null; // matrix is singular
    }

    // Swap max row with i-th (current) row
    const tmp = mat[maxRow];
    mat[maxRow] = mat[i];
    mat[i] = tmp;

    // Subtract the i-th row to make all the remaining rows 0 in the i-th column
    for (let j = i + 1; j < n; j++) {
      const coef = -mat[j][i] / mat[i][i];
      for (let k = i; k < n + 1; k++) {
        if (i == k) {
          mat[j][k] = 0;
        } else {
          mat[j][k] += coef * mat[i][k];
        }
      }
    }
  }

  // Solve Ax=b for upper triangular matrix A (mat)
  const x = new Array(n);
  for (let l = n - 1; l >= 0; l--) {
    x[l] = mat[l][n] / mat[l][l];
    for (let m = l - 1; m >= 0; m--) {
      mat[m][n] -= mat[m][l] * x[l];
    }
  }
  return x;
}

/**
 * Converts radians to to degrees.
 *
 * @param {number} angleInRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
export function toDegrees(angleInRadians) {
  return (angleInRadians * 180) / Math.PI;
}

/**
 * Converts degrees to radians.
 *
 * @param {number} angleInDegrees Angle in degrees.
 * @return {number} Angle in radians.
 */
export function toRadians(angleInDegrees) {
  return (angleInDegrees * Math.PI) / 180;
}

/**
 * Returns the modulo of a / b, depending on the sign of b.
 *
 * @param {number} a Dividend.
 * @param {number} b Divisor.
 * @return {number} Modulo.
 */
export function modulo(a, b) {
  const r = a % b;
  return r * b < 0 ? r + b : r;
}

/**
 * Calculates the linearly interpolated value of x between a and b.
 *
 * @param {number} a Number
 * @param {number} b Number
 * @param {number} x Value to be interpolated.
 * @return {number} Interpolated value.
 */
export function lerp(a, b, x) {
  return a + x * (b - a);
}

/**
 * Returns a number with a limited number of decimal digits.
 * @param {number} n The input number.
 * @param {number} decimals The maximum number of decimal digits.
 * @return {number} The input number with a limited number of decimal digits.
 */
export function toFixed(n, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Rounds a number to the nearest integer value considering only the given number
 * of decimal digits (with rounding on the final digit).
 * @param {number} n The input number.
 * @param {number} decimals The maximum number of decimal digits.
 * @return {number} The nearest integer.
 */
export function round(n, decimals) {
  return Math.round(toFixed(n, decimals));
}

/**
 * Rounds a number to the next smaller integer considering only the given number
 * of decimal digits (with rounding on the final digit).
 * @param {number} n The input number.
 * @param {number} decimals The maximum number of decimal digits.
 * @return {number} The next smaller integer.
 */
export function floor(n, decimals) {
  return Math.floor(toFixed(n, decimals));
}

/**
 * Rounds a number to the next bigger integer considering only the given number
 * of decimal digits (with rounding on the final digit).
 * @param {number} n The input number.
 * @param {number} decimals The maximum number of decimal digits.
 * @return {number} The next bigger integer.
 */
export function ceil(n, decimals) {
  return Math.ceil(toFixed(n, decimals));
}
