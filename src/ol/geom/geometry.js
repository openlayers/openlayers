goog.require('ol.Extent');
goog.provide('ol.geom.Coordinate');
goog.provide('ol.geom.CoordinateArray');
goog.provide('ol.geom.Geometry');



/**
 * @interface
 */
ol.geom.Geometry = function() {};


/**
 * The dimension of this geometry (2 or 3).
 * @type {number}
 */
ol.geom.Geometry.prototype.dimension;


/**
 * Get the rectangular 2D evelope for this geoemtry.
 * @return {ol.Extent} The bounding rectangular envelope.
 */
ol.geom.Geometry.prototype.getBounds = goog.abstractMethod;


/**
 * @typedef {Array.<number>}
 */
ol.geom.Coordinate;


/**
 * @typedef {Array.<ol.geom.Coordinate>}
 */
ol.geom.CoordinateArray;
