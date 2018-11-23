/**
 * @module ol/rotationconstraint
 */
import {toRadians} from './math.js';


/**
 * @typedef {function((number|undefined), boolean): (number|undefined)} Type
 */


/**
 * @param {number|undefined} rotation Rotation.
 * @return {number|undefined} Rotation.
 */
export function disable(rotation) {
  if (rotation !== undefined) {
    return 0;
  } else {
    return undefined;
  }
}


/**
 * @param {number|undefined} rotation Rotation.
 * @return {number|undefined} Rotation.
 */
export function none(rotation) {
  if (rotation !== undefined) {
    return rotation;
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
     * @param {boolean} whileInteracting Will be true if the constraint is applied
     * during an interaction.
     * @return {number|undefined} Rotation.
     */
    function(rotation, whileInteracting) {
      if (whileInteracting) {
        return rotation;
      }
      if (rotation !== undefined) {
        return Math.floor(rotation / theta + 0.5) * theta;
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
     * @param {boolean} whileInteracting Will be true if the constraint is applied
     * during an interaction.
     * @return {number|undefined} Rotation.
     */
    function(rotation, whileInteracting) {
      if (whileInteracting) {
        return rotation;
      }
      if (rotation !== undefined) {
        if (Math.abs(rotation) <= tolerance) {
          return 0;
        } else {
          return rotation;
        }
      } else {
        return undefined;
      }
    });
}
