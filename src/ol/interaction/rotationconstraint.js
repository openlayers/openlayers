goog.provide('ol.interaction.RotationConstraint');
goog.provide('ol.interaction.RotationConstraintType');


/**
 * @typedef {function((number|undefined), number): (number|undefined)}
 */
ol.interaction.RotationConstraintType;


/**
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @return {number|undefined} Rotation.
 */
ol.interaction.RotationConstraint.none = function(rotation, delta) {
  if (goog.isDef(rotation)) {
    return rotation + delta;
  } else {
    return undefined;
  }
};


/**
 * @param {number} n N.
 * @return {ol.interaction.RotationConstraintType} Rotation constraint.
 */
ol.interaction.RotationConstraint.createSnapToN = function(n) {
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
