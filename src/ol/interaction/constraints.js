goog.provide('ol.interaction.Constraints');

goog.require('ol.interaction.CenterConstraintType');
goog.require('ol.interaction.ResolutionConstraintType');
goog.require('ol.interaction.RotationConstraintType');



/**
 * @constructor
 * @param {ol.interaction.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 * @param {ol.interaction.RotationConstraintType} rotationConstraint
 *     Rotation constraint.
 */
ol.interaction.Constraints =
    function(resolutionConstraint, rotationConstraint) {

  /**
   * @type {ol.interaction.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

  /**
   * @type {ol.interaction.RotationConstraintType}
   */
  this.rotation = rotationConstraint;

};
