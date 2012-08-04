goog.provide('ol.control.Constraints');

goog.require('ol.control.CenterConstraintType');
goog.require('ol.control.ResolutionConstraintType');
goog.require('ol.control.RotationConstraintType');



/**
 * @constructor
 * @param {ol.control.CenterConstraintType} centerConstraint Center constraint.
 * @param {ol.control.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 * @param {ol.control.RotationConstraintType} rotationConstraint
 *     Rotation constraint.
 */
ol.control.Constraints =
    function(centerConstraint, resolutionConstraint, rotationConstraint) {

  /**
   * @type {ol.control.CenterConstraintType}
   */
  this.center = centerConstraint;

  /**
   * @type {ol.control.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

  /**
   * @type {ol.control.RotationConstraintType}
   */
  this.rotation = rotationConstraint;

};
