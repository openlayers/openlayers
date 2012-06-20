goog.provide('ol.geom.Point');

goog.require('ol.geom.Geometry');

goog.require('ol.Projection');
goog.require('ol.coord.AccessorInterface');

/**
 * Creates ol.geom.Point objects. 
 * 
 * @extends {ol.geom.Geometry}
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 * @param {ol.Projection=} opt_projection Projection.
 * 
 * @implements {ol.coord.AccessorInterface}
 * 
 * @constructor
 */
ol.geom.Point = function(x, y, opt_z, opt_projection) {
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
    
    /**
     * @private
     * @type {ol.Projection}
     */
    this.projection_ = goog.isDef(opt_projection) ? opt_projection : null;
};

goog.inherits(ol.geom.Point, ol.geom.Geometry);

/**
 * @return {number} X.
 */
ol.geom.Point.prototype.getX = function() {
    return this.x_;
};


/**
 * @return {number} Y.
 */
ol.geom.Point.prototype.getY = function() {
    return this.y_;
};


/**
 * @return {number|undefined} Z.
 */
ol.geom.Point.prototype.getZ = function() {
    return this.z_;
};

/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.geom.Point.prototype.getProjection = function() {
    return this.projection_;
};

/**
 * @param {ol.Projection} projection Projection.
 */
ol.geom.Point.prototype.setProjection = function(projection) {
    this.projection_ = projection;
};

/**
 * @param {number} x X.
 */
ol.geom.Point.prototype.setX = function(x) {
    this.x_ = x;
};


/**
 * @param {number} y Y.
 */
ol.geom.Point.prototype.setY = function(y) {
    this.y_ = y;
};


/**
 * @param {number|undefined} z Z.
 */
ol.geom.Point.prototype.setZ = function(z) {
    this.z_ = z;
};

