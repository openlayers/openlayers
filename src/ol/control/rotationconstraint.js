goog.provide('ol.control.RotationConstraint');
goog.provide('ol.control.RotationConstraintType');


/**
 * @typedef {function((number|undefined), number): (number|undefined)}
 */
ol.control.RotationConstraintType;


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
ol.control.RotationConstraint.none = function(rotation, delta) {
  if (goog.isDef(rotation)) {
    return rotation + delta;
  } else {
    return undefined;
  }
};


/**
 * @param {number} n N.
 * @return {ol.control.RotationConstraintType} Rotation constraint.
 */
ol.control.RotationConstraint.createSnapToN = function(n) {
  var theta = 2 * Math.PI / n;
  return function(rotation, delta) {
    if (goog.isDef(rotation)) {
      rotation = Math.floor((rotation + delta) / theta + 0.5) * theta;
      return rotation;
    } else {
      return undefined;
    }
  };
};
