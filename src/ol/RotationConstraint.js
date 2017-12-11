goog.provide('ol.RotationConstraint');

goog.require('ol.math');


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
ol.RotationConstraint.disable = function(rotation, delta) {
  if (rotation !== undefined) {
    return 0;
  } else {
    return undefined;
  }
};


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
ol.RotationConstraint.none = function(rotation, delta) {
  if (rotation !== undefined) {
    return rotation + delta;
  } else {
    return undefined;
  }
};


/**
 * @param {number} n N.
 * @return {ol.RotationConstraintType} Rotation constraint.
 */
ol.RotationConstraint.createSnapToN = function(n) {
  var theta = 2 * Math.PI / n;
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
};


/**
 * @param {number=} opt_tolerance Tolerance.
 * @return {ol.RotationConstraintType} Rotation constraint.
 */
ol.RotationConstraint.createSnapToZero = function(opt_tolerance) {
  var tolerance = opt_tolerance || ol.math.toRadians(5);
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
};
