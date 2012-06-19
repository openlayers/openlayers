goog.provide('ol.Loc');

goog.require('ol.Projection');



/**
 * @constructor
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number=} opt_z Z.
 * @param {ol.Projection=} opt_projection Projection.
 */
ol.Loc = function(x, y, opt_z, opt_projection) {

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
     * @type {ol.Projection|undefined}
     */
    this.projection_ = opt_projection;

};


/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.Loc.prototype.getProjection = function() {
    return this.projection_;
};


/**
 * @return {number} X.
 */
ol.Loc.prototype.getX = function() {
    return this.x_;
};


/**
 * @return {number} Y.
 */
ol.Loc.prototype.getY = function() {
    return this.y_;
};


/**
 * @return {number|undefined} Z.
 */
ol.Loc.prototype.getZ = function() {
    return this.z_;
};


/**
 * @param {ol.Projection|undefined} projection Projection.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setProjection = function(projection) {
    this.projection_ = projection;
    return this;
};


/**
 * @param {number} x X.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setX = function(x) {
    this.x_ = x;
    return this;
};


/**
 * @param {number} y Y.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setY = function(y) {
    this.y_ = y;
    return this;
};


/**
 * @param {number|undefined} z Z.
 * @return {ol.Loc} This.
 */
ol.Loc.prototype.setZ = function(z) {
    this.z_ = z;
    return this;
};

/**
 * Transform this location to another coordinate reference system.  This 
 * requires that this location has a projection set already (if not, an error
 * will be thrown).  Returns a new location object and does not modify this
 * location.
 *
 * @param {string|!ol.Projection} proj The destination projection.  Can be 
 *     supplied as a projection instance of a string identifier.
 * @returns {!ol.Loc} A new location.
 */
ol.Loc.prototype.transform = function(proj) {
    if (goog.isString(proj)) {
        proj = new ol.Projection(proj);
    }
    return this.transform_(proj);
};

/**
 * Transform this location to a new location given a projection object.
 *
 * @param {!ol.Projection} proj The destination projection.
 * @returns {!ol.Loc}
 */
ol.Loc.prototype.transform_ = function(proj) {
    var point = {x: this.x_, y: this.y_};
    var sourceProj = this.projection_;
    if (!goog.isDefAndNotNull(sourceProj)) {
        throw new Error("Cannot transform a location without a source projection.");
    }
    ol.Projection.transform(point, sourceProj, proj);
    return new ol.Loc(point['x'], point['y'], this.z_, proj);
};

/**
 * Clean up.
 */
ol.Loc.prototype.destroy = function() {
    for (var key in this) {
        delete this[key];
    }
};
