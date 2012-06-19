goog.provide('ol.geom.Point'); 
goog.require('ol.geom.Geometry');
goog.require('ol.mixins.coordinate');
goog.require('ol.interfaces.coordinateAccessor');

/**
 * Creates ol.geom.Point objects. 
 * 
 * @extends {ol.geom.Geometry}
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 * 
 * @implements {ol.interfaces.coordinateAccessor}
 * 
 * @constructor
 */
ol.geom.Point = function(x, y, opt_z) {
    /**
     * @private
     * @type {number}
     */
    this.x_ = x;
    
    /**
     * @private
     * @type {number}
     */
    this.y_ = y;
    
    /**
     * @private
     * @type {number|undefined}
     */
    this.z_ = opt_z;
};

goog.inherits(ol.geom.Point, ol.geom.Geometry);

goog.mixin(ol.geom.Point.prototype, ol.mixins.coordinate);

///**
// * @override
// */
//ol.geom.Point.prototype.getX = ol.geom.Point.prototype.getX;
///**
// * @override
// */
//ol.geom.Point.prototype.setX = ol.geom.Point.prototype.setX;
///**
// * @override
// */
//ol.geom.Point.prototype.getY = ol.geom.Point.prototype.getY;
///**
// * @override
// */
//ol.geom.Point.prototype.setY = ol.geom.Point.prototype.setY;
///**
// * @override
// */
//ol.geom.Point.prototype.getZ = ol.geom.Point.prototype.getZ;
///**
// * @override
// */
//ol.geom.Point.prototype.setZ = ol.geom.Point.prototype.setZ;
