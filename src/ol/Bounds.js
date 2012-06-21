goog.provide('ol.Bounds');

goog.require('ol.UnreferencedBounds');
goog.require('ol.Loc');
goog.require('ol.Projection');

goog.require('goog.string.format')

/**
 * @export
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {ol.Projection=} opt_projection Projection.
 * @extends {ol.UnreferencedBounds}
 */
ol.Bounds = function(minX, minY, maxX, maxY, opt_projection) {

    goog.base(this, minX, minY, maxX, maxY);

    /**
     * @protected
     * @type {ol.Projection}
     */
    this.projection_ = goog.isDef(opt_projection) ? opt_projection : null;

};
goog.inherits(ol.Bounds, ol.UnreferencedBounds);

/**
 * @return {ol.Projection} Projection.
 */
ol.Bounds.prototype.getProjection = function() {
    return this.projection_;
};

/**
 * @param {ol.Projection} projection Projection.
 */
ol.Bounds.prototype.setProjection = function(projection) {
    this.projection_ = projection;
};

/**
 * Determine if this bounds intersects the target bounds (bounds that only
 * touch are considered intersecting).
 *
 * @param {ol.Bounds} bounds Target bounds.
 * @return {boolean} The provided bounds intersects this bounds.
 */
ol.Bounds.prototype.intersects = function(bounds) {
    var otherProj = bounds.getProjection();
    if (!goog.isNull(otherProj) && !goog.isNull(this.projection_)) {
        bounds = bounds.transform(this.projection_);
    }
    return goog.base(this, "intersects", bounds.toUnreferencedBounds());
};

/**
 * Transform this node into another coordinate reference system.  Returns a new
 * bounds instead of modifying this bounds.
 *
 * @param {ol.Projection} proj Target projection.
 * @return {ol.Bounds} A new bounds in the target projection.
 */
ol.Bounds.prototype.doTransform = function(proj) {
    if (goog.isNull(this.projection_)) {
        throw new Error("Bounds must have a projection before transforming.");
    }
    var tl = new ol.Loc(
        this.minX_, this.maxY_, undefined, this.projection_).transform(proj);
    var tr = new ol.Loc(
        this.maxX_, this.maxY_, undefined, this.projection_).transform(proj);
    var bl = new ol.Loc(
        this.minX_, this.minY_, undefined, this.projection_).transform(proj);
    var br = new ol.Loc(
        this.maxX_, this.minY_, undefined, this.projection_).transform(proj);
        
    var x = [tl.getX(), tr.getX(), bl.getX(), br.getX()].sort();
    var y = [tl.getY(), tr.getY(), bl.getY(), br.getY()].sort();
    
    return new ol.Bounds(x[0], y[0], x[3], y[3], proj);
};

/**
 * Return a bbox string for this bounds.
 *
 * @return {string} The "minx,miny,maxx,maxy" representation of this bounds.
 */
ol.Bounds.prototype.toBBOX = function() {
    return goog.string.format(
        '%f,%f,%f,%f', this.minX_, this.minY_, this.maxX_, this.maxY_);
};

/**
 * Cast this bounds into an unreferenced bounds.
 * 
 * @returns {ol.UnreferencedBounds}
 */
ol.Bounds.prototype.toUnreferencedBounds = function() {
    return new ol.UnreferencedBounds(
        this.getMinX(), this.getMinY(), this.getMaxX(), this.getMaxY());
};
