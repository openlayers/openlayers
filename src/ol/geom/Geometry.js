goog.provide('ol.geom.Geometry');

goog.require('ol.geom.IGeometry');
goog.require('ol.Bounds');

/**
 * Creates ol.Geometry objects.
 *
 * @export
 * @implements {ol.geom.IGeometry}
 * @constructor
 */
ol.geom.Geometry = function() {

    /**
     * @private
     * @type {ol.Bounds|undefined}
     */
    this.bounds_ = undefined;
};

/**
 * @return {ol.Bounds|undefined} The ol.Bounds.
 */
ol.geom.Geometry.prototype.getBounds = function() {
    return this.bounds_;
};

/**
 * @param {ol.Bounds} bounds The new ol.Bounds.
 * @return {ol.geom.Geometry} This.
 */
ol.geom.Geometry.prototype.setBounds = function(bounds) {
    this.bounds_ = bounds;
    return this;
};

/**
 * Returns the centroid of the geometry.
 *
 * @returns {ol.geom.Point} The centroid of the geometry.
 */
ol.geom.Geometry.prototype.getCentroid = function() {
    // throw an error to enforce subclasses to implement it properly
    ol.error('ol.geom.Geometry: getCentroid must be implemented by subclasses');
    return null;
};

/**
 * Returns the area of the geometry.
 *
 * @returns {number}  The area of the geometry.
 */
ol.geom.Geometry.prototype.getArea = function() {
    // throw an error to enforce subclasses to implement it properly
    ol.error('ol.geom.Geometry: getArea must be implemented by subclasses');
    return 0;
};
