goog.provide('ol3.interaction.CenterConstraint');
goog.provide('ol3.interaction.CenterConstraintType');

goog.require('ol3.Coordinate');


/**
 * @typedef {function((ol3.Coordinate|undefined),
 *                    (number|undefined),
 *                    ol3.Coordinate): (ol3.Coordinate|undefined)}
 */
ol3.interaction.CenterConstraintType;


/**
 * @param {ol3.Coordinate|undefined} center Center.
 * @param {number|undefined} resolution Resolution.
 * @param {ol3.Coordinate} delta Delta.
 * @return {ol3.Coordinate|undefined} Center.
 */
ol3.interaction.CenterConstraint.none = function(center, resolution, delta) {
  if (goog.isDefAndNotNull(center) && goog.isDef(resolution)) {
    var x = center.x + delta.x;
    var y = center.y + delta.y;
    return new ol3.Coordinate(x, y);
  } else {
    return undefined;
  }
};


/**
 * @param {ol3.Coordinate|undefined} center Center.
 * @param {number|undefined} resolution Resolution.
 * @param {ol3.Coordinate} delta Delta.
 * @return {ol3.Coordinate|undefined} Center.
 */
ol3.interaction.CenterConstraint.snapToPixel =
    function(center, resolution, delta) {
  if (goog.isDefAndNotNull(center) && goog.isDef(resolution)) {
    var x = Math.floor((center.x + delta.x) / resolution + 0.5) * resolution;
    var y = Math.floor((center.y + delta.y) / resolution + 0.5) * resolution;
    return new ol3.Coordinate(x, y);
  } else {
    return undefined;
  }
};
