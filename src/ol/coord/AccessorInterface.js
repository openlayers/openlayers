goog.provide('ol.coord.AccessorInterface');

goog.require('ol.Projection');

/**
 * The AccessorInterface in coord package
 * 
 * @interface
 * 
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 * @param {ol.Projection=} opt_projection Projection.
 */
ol.coord.AccessorInterface = function(x, y, opt_z, opt_projection){

};

/**
 * @return {number} X.
 */
ol.coord.AccessorInterface.prototype.getX = function(){};

/**
 * @return {number} Y.
 */
ol.coord.AccessorInterface.prototype.getY = function(){};

/**
 * @return {number|undefined} Z.
 */
ol.coord.AccessorInterface.prototype.getZ = function(){};

/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.coord.AccessorInterface.prototype.getProjection = function() {};

/**
 * @param {number} x X.
 */
ol.coord.AccessorInterface.prototype.setX = function(x){};

/**
 * @param {number} y Y.
 */
ol.coord.AccessorInterface.prototype.setY = function(y){};

/**
 * @param {number|undefined} z Z.
 */
ol.coord.AccessorInterface.prototype.setZ = function(z){};

/**
 * @param {ol.Projection} projection Projection.
 */
ol.coord.AccessorInterface.prototype.setProjection = function(projection) {};

