/**
 * @module ol/rotationconstraint
 */
import {toRadians} from './math.js';

/**
 * @typedef {function((number|undefined), boolean=): (number|undefined)} Type
 */

/**
 * @param {number|undefined} rotation Rotation.
 * @return {number|undefined} Rotation.
 */
export function disable(rotation) {
  if (rotation !== undefined) {
    return 0;
  }
  return undefined;
}

/**
 * @param {number|undefined} rotation Rotation.
 * @return {number|undefined} Rotation.
 */
export function none(rotation) {
  if (rotation !== undefined) {
    return rotation;
  }
  return undefined;
}

/**
 * @param {number} n N.
 * @return {Type} Rotation constraint.
 */
export function createSnapToN(n) {
  const theta = (2 * Math.PI) / n;
  return (
    /**
     * @param {number|undefined} rotation Rotation.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @return {number|undefined} Rotation.
     */
    function (rotation, isMoving) {
      if (isMoving) {
        return rotation;
      }

      if (rotation !== undefined) {
        rotation = Math.floor(rotation / theta + 0.5) * theta;
        return rotation;
      }
      return undefined;
    }
  );
}

/**
 * @param {number} [tolerance] Tolerance.
 * @return {Type} Rotation constraint.
 */
export function createSnapToZero(tolerance) {
  tolerance = tolerance || toRadians(5);
  return (
    /**
     * @param {number|undefined} rotation Rotation.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @return {number|undefined} Rotation.
     */
    function (rotation, isMoving) {
      if (isMoving) {
        return rotation;
      }

      if (rotation !== undefined) {
        if (Math.abs(rotation) <= tolerance) {
          return 0;
        }
        return rotation;
      }
      return undefined;
    }
  );
}
