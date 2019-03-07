/**
 * @module ol/rotationconstraint
 */
import {toRadians} from './math.js';


/**
 * @typedef {function((number|undefined), number): (number|undefined)} Type
 */


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
export function disable(rotation, delta) {
  if (rotation !== undefined) {
    return 0;
  } else {
    return undefined;
  }
}


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
export function none(rotation, delta) {
  if (rotation !== undefined) {
    return rotation + delta;
  } else {
    return undefined;
  }
}


/**
 * @param {number} n N.
 * @return {Type} Rotation constraint.
 */
export function createSnapToN(n) {
  const theta = 2 * Math.PI / n;
  return (
    /**
     * @param {number|undefined} rotation Rotation.
     * @param {number} delta Delta.
     * @return {number|undefined} Rotation.
     */
    function(rotation, delta) {
      if (rotation !== undefined) {
        rotation = Math.floor((rotation + delta) / theta + 0.5) * theta;
        return rotation;
      } else {
        return undefined;
      }
    });
}


/**
 * @param {number=} opt_tolerance Tolerance.
 * @return {Type} Rotation constraint.
 */
export function createSnapToZero(opt_tolerance) {
  const tolerance = opt_tolerance || toRadians(5);
  return (
    /**
     * @param {number|undefined} rotation Rotation.
     * @param {number} delta Delta.
     * @return {number|undefined} Rotation.
     */
    function(rotation, delta) {
      if (rotation !== undefined) {
        if (Math.abs(rotation + delta) <= tolerance) {
          return 0;
        } else {
          return rotation + delta;
        }
      } else {
        return undefined;
      }
    });
}
