goog.provide('ol3.interaction.Constraints');

goog.require('ol3.interaction.CenterConstraintType');
goog.require('ol3.interaction.ResolutionConstraintType');
goog.require('ol3.interaction.RotationConstraintType');



/**
 * @constructor
 * @param {ol3.interaction.CenterConstraintType} centerConstraint
 *     Center constraint.
 * @param {ol3.interaction.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 * @param {ol3.interaction.RotationConstraintType} rotationConstraint
 *     Rotation constraint.
 */
ol3.interaction.Constraints =
    function(centerConstraint, resolutionConstraint, rotationConstraint) {

  /**
   * @type {ol3.interaction.CenterConstraintType}
   */
  this.center = centerConstraint;

  /**
   * @type {ol3.interaction.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

  /**
   * @type {ol3.interaction.RotationConstraintType}
   */
  this.rotation = rotationConstraint;

};
