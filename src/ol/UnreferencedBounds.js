goog.provide('ol.UnreferencedBounds');

/**
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol.UnreferencedBounds = function(minX, minY, maxX, maxY) {

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

};


/**
 * @return {number} Minimun X.
 */
ol.UnreferencedBounds.prototype.getMinX = function() {
    return this.minX_;
};

/**
 * @param {number} minX Minimum X.
 */
ol.UnreferencedBounds.prototype.setMinX = function(minX) {
    this.minX_ = minX;
};

/**
 * @return {number} Minimun Y.
 */
ol.UnreferencedBounds.prototype.getMinY = function() {
    return this.minY_;
};

/**
 * @param {number} minY Minimum Y.
 */
ol.UnreferencedBounds.prototype.setMinY = function(minY) {
    this.minY_ = minY;
};

/**
 * @return {number} Maximun X.
 */
ol.UnreferencedBounds.prototype.getMaxX = function() {
    return this.maxX_;
};

/**
 * @param {number} maxX Maximum X.
 */
ol.UnreferencedBounds.prototype.setMaxX = function(maxX) {
    this.maxX_ = maxX;
};

/**
 * @return {number} Maximun Y.
 */
ol.UnreferencedBounds.prototype.getMaxY = function() {
    return this.maxY_;
};

/**
 * @param {number} maxY Maximum Y.
 */
ol.UnreferencedBounds.prototype.setMaxY = function(maxY) {
    this.maxY_ = maxY;
};

