goog.provide('ol.geom.MultiPoint');

goog.require('goog.array');
goog.require('ol.geom.Geometry');
goog.require('ol.Projection');

/**
 * Creates ol.geom.MultiPoint objects. 
 * 
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.Point>} points An array of points.
 * 
 * @constructor
 */
ol.geom.MultiPoint = function(points) {
    /**
     * @private
     * @type {Array.<ol.geom.Point>}
     */
    this.points_ = points;
    
};

goog.inherits(ol.geom.MultiPoint, ol.geom.Geometry);

/**
 * Sets the MultiPoint's points.
 * 
 * @return {Array.<ol.geom.Point>} An array of points.
 */
ol.geom.MultiPoint.prototype.getPoints = function() {
    return this.points_;
};

/**
 * Gets the MultiPoint's points.
 * 
 * @param {Array.<ol.geom.Point>} points An array of points.
 */
ol.geom.MultiPoint.prototype.setPoints = function(points) {
    this.points_ = points;
};

/**
 * Adds the given point to the list of points at the specified index.
 * 
 * @param {ol.geom.Point} point A point to be added.
 * @param {number} index The index where to add.
 */
ol.geom.MultiPoint.prototype.addPoint = function(point, index) {
    goog.array.insertAt(this.points_,point,index);
};

/**
 * Removes the given point from the list of points.
 * 
 * @param {ol.geom.Point} point A point to be removed.
 */
ol.geom.MultiPoint.prototype.removePoint = function(point) {
    goog.array.remove(this.points_, point);
};
