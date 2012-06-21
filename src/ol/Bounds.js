goog.provide('ol.Bounds');
goog.require('ol.UnreferencedBounds');
goog.require('ol.Projection');

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

