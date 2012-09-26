goog.provide('ol.Constraints');

goog.require('ol.ResolutionConstraintType');
goog.require('ol.RotationConstraintType');



/**
 * @constructor
 * @param {ol.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 * @param {ol.RotationConstraintType} rotationConstraint
 *     Rotation constraint.
 */
ol.Constraints = function(resolutionConstraint, rotationConstraint) {

  /**
   * @type {ol.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

  /**
   * @type {ol.RotationConstraintType}
   */
  this.rotation = rotationConstraint;

};
