goog.provide('ol.geom.Point');

goog.require('ol.geom.Geometry');

goog.require('ol.Projection');
goog.require('ol.coord.AccessorInterface');
goog.require('ol.base');

/**
 * Creates ol.geom.Point objects. 
 * 
 * @export
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

/**
 * Transform this point to another coordinate reference system.  This 
 * requires that this point has a projection set already (if not, an error
 * will be thrown).  Returns a new point object and does not modify this
 * point.
 *
 * @param {string|!ol.Projection} proj The destination projection.  Can be 
 *     supplied as a projection instance of a string identifier.
 * @returns {!ol.geom.Point} A new location.
 */
ol.geom.Point.prototype.transform = function(proj) {
    if (goog.isString(proj)) {
        proj = new ol.Projection(proj);
    }
    return this._transform(proj);
};

/**
 * Transform this point to a new location given a projection object.
 *
 * @param {!ol.Projection} proj The destination projection.
 * @returns {!ol.geom.Point}
 * @private
 */
ol.geom.Point.prototype._transform = function(proj) {
    var point = {'x': this.x_, 'y': this.y_};
    var sourceProj = this.projection_;
    if (!goog.isDefAndNotNull(sourceProj)) {
        var msg = 'Cannot transform a point without a source projection.';
        ol.error(msg);
    }
    ol.Projection.transform(point, sourceProj, proj);
    
    return new ol.geom.Point(point['x'], point['y'], this.z_, proj);
};

