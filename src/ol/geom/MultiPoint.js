goog.provide('ol.geom.MultiPoint');

goog.require('goog.array');
goog.require('ol.geom.Collection');

/**
 * Creates ol.geom.MultiPoint objects. 
 * 
 * @extends {ol.geom.Collection}
 * @param {Array.<ol.geom.Point>} points An array of points.
 * 
 * @constructor
 */
ol.geom.MultiPoint = function(points) {
    this.setComponents(points);
};

goog.inherits(ol.geom.MultiPoint, ol.geom.Collection);

/**
 * Sets the MultiPoint's points.
 * 
 * @return {Array.<ol.geom.Point>} An array of points.
 */
ol.geom.MultiPoint.prototype.getPoints = function() {
    return this.getComponents();
};

/**
 * Gets the MultiPoint's points.
 * 
 * @param {Array.<ol.geom.Point>} points An array of points.
 */
ol.geom.MultiPoint.prototype.setPoints = function(points) {
    this.setComponents(points);
};

/**
 * Adds the given point to the list of points at the specified index.
 * 
 * @param {ol.geom.Point} point A point to be added.
 * @param {number} index The index where to add.
 */
ol.geom.MultiPoint.prototype.addPoint = function(point, index) {
    this.addComponent(point, index);
};

/**
 * Removes the given point from the list of points.
 * 
 * @param {ol.geom.Point} point A point to be removed.
 */
ol.geom.MultiPoint.prototype.removePoint = function(point) {
    this.removeComponent(point);
};
