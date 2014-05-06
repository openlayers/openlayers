goog.provide('ol.Constraints');

goog.require('ol.CenterConstraintType');
goog.require('ol.ResolutionConstraintType');
goog.require('ol.RotationConstraintType');



/**
 * @constructor
 * @param {ol.CenterConstraintType} centerConstraint Center constraint.
 * @param {ol.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 * @param {ol.RotationConstraintType} rotationConstraint
 *     Rotation constraint.
 */
ol.Constraints =
    function(centerConstraint, resolutionConstraint, rotationConstraint) {

  /**
   * @type {ol.CenterConstraintType}
   */
  this.center = centerConstraint;

  /**
   * @type {ol.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

  /**
   * @type {ol.RotationConstraintType}
   */
  this.rotation = rotationConstraint;

};
