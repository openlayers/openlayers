goog.provide('ol.interaction.CenterConstraint');
goog.provide('ol.interaction.CenterConstraintType');

goog.require('ol.Coordinate');


/**
 * @typedef {function((ol.Coordinate|undefined),
 *                    (number|undefined),
 *                    ol.Coordinate): (ol.Coordinate|undefined)}
 */
ol.interaction.CenterConstraintType;


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @param {number|undefined} resolution Resolution.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate|undefined} Center.
 */
ol.interaction.CenterConstraint.none = function(center, resolution, delta) {
  if (goog.isDefAndNotNull(center) && goog.isDef(resolution)) {
    var x = center.x + delta.x;
    var y = center.y + delta.y;
    return new ol.Coordinate(x, y);
  } else {
    return undefined;
  }
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @param {number|undefined} resolution Resolution.
 * @param {ol.Coordinate} delta Delta.
 * @return {ol.Coordinate|undefined} Center.
 */
ol.interaction.CenterConstraint.snapToPixel =
    function(center, resolution, delta) {
  if (goog.isDefAndNotNull(center) && goog.isDef(resolution)) {
    var x = Math.floor((center.x + delta.x) / resolution + 0.5) * resolution;
    var y = Math.floor((center.y + delta.y) / resolution + 0.5) * resolution;
    return new ol.Coordinate(x, y);
  } else {
    return undefined;
  }
};
