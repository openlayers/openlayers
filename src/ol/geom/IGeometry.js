goog.provide('ol.geom.IGeometry');

//goog.require('ol.geom.Point');
//goog.require('ol.Bounds');

/**
 * Interface for geometry classes forcing ol.geom.* classes to implement
 * expected functionality.
 *
 * @interface
 */
ol.geom.IGeometry = function(){};

/**
 * @return {ol.geom.Point} The centroid of the geometry.
 */
ol.geom.IGeometry.prototype.getCentroid = function(){};

/**
 * @return {ol.Bounds|undefined} The centroid of the geometry.
 */
ol.geom.IGeometry.prototype.getBounds = function(){};

/**
 * @return {number} The area of the geometry.
 */
ol.geom.IGeometry.prototype.getArea = function(){};