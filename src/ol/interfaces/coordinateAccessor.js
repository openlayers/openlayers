goog.provide('ol.interfaces.coordinateAccessor');

/**
 * The coordinateAccessor interface
 * 
 * @lends {ol.geom.Point#}
 * @interface
 * 
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 */
ol.interfaces.coordinateAccessor = function(x, y, opt_z){

};

/**
 * @return {number} X.
 */
ol.interfaces.coordinateAccessor.prototype.getX = function(){};

/**
 * @return {number} Y.
 */
ol.interfaces.coordinateAccessor.prototype.getY = function(){};

/**
 * @return {number|undefined} Z.
 */
ol.interfaces.coordinateAccessor.prototype.getZ = function(){};

/**
 * @param {number} x X.
 * @return {Object} This.
 */
ol.interfaces.coordinateAccessor.prototype.setX = function(x){};

/**
 * @param {number} y Y.
 * @return {Object} This.
 */
ol.interfaces.coordinateAccessor.prototype.setY = function(y){};

/**
 * @param {number|undefined} z Z.
 * @return {Object} This.
 */
ol.interfaces.coordinateAccessor.prototype.setZ = function(z){};
