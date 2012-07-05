goog.provide('ol.Bounds');

goog.require('goog.math.Box');



/**
 * @constructor
 * @extends {goog.math.Box}
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 */
ol.Bounds = function(top, right, bottom, left) {

  goog.base(this, top, right, bottom, left);

};
goog.inherits(ol.Bounds, goog.math.Box);
