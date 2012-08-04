// FIXME add rotation constraint

goog.provide('ol.control.Constraints');

goog.require('ol.control.CenterConstraintType');
goog.require('ol.control.ResolutionConstraintType');



/**
 * @constructor
 * @param {ol.control.CenterConstraintType} centerConstraint Center constraint.
 * @param {ol.control.ResolutionConstraintType} resolutionConstraint
 *     Resolution constraint.
 */
ol.control.Constraints = function(centerConstraint, resolutionConstraint) {

  /**
   * @type {ol.control.CenterConstraintType}
   */
  this.center = centerConstraint;

  /**
   * @type {ol.control.ResolutionConstraintType}
   */
  this.resolution = resolutionConstraint;

};
