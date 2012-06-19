goog.provide('ol.Bounds');
goog.require('ol.UnreferencedBounds');
goog.require('ol.Projection');

/**
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {ol.Projection=} opt_projection Projection.
 * @extends {ol.UnreferencedBounds}
 */
ol.Bounds = function(minX, minY, maxX, maxY, opt_projection) {

    /**
     * @private
     * @type {number}
     */
    this.minX_ = minX;

    /**
     * @private
     * @type {number}
     */
    this.minY_ = minY;

    /**
     * @private
     * @type {number}
     */
    this.maxX_ = maxX;

    /**
     * @private
     * @type {number}
     */
    this.maxY_ = maxY;

    /**
     * @private
     * @type {ol.Projection|undefined}
     */
    this.projection_ = opt_projection;

};
goog.inherits(ol.Bounds, ol.UnreferencedBounds);

/**
 * @param {number} minX Minimum X.
 * @return {!ol.Bounds} This.
 */
ol.Bounds.prototype.setMinX = function(minX) {
    this.minX_ = minX;
    return this;
};

/**
 * @param {number} maxX Maximum X.
 * @return {!ol.Bounds} This.
 */
ol.Bounds.prototype.setMaxX = function(maxX) {
    this.maxX_ = maxX;
    return this;
};

/**
 * @param {number} minY Minimum Y.
 * @return {!ol.Bounds} This.
 */
ol.Bounds.prototype.setMinY = function(minY) {
    this.minY_ = minY;
    return this;
};

/**
 * @param {number} maxY Maximum Y.
 * @return {!ol.Bounds} This.
 */
ol.Bounds.prototype.setMaxY = function(maxY) {
    this.maxY_ = maxY;
    return this;
};

/**
 * @return {ol.Projection|undefined} Projection.
 */
ol.Bounds.prototype.getProjection = function() {
    return this.projection_;
};

/**
 * @param {ol.Projection|undefined} projection Projection.
 * @return {ol.Bounds} This.
 */
ol.Bounds.prototype.setProjection = function(projection) {
    this.projection_ = projection;
    return this;
};
