goog.provide('ol.geom.Geometry'); 

goog.require('ol.Bounds');

/**
 * Creates ol.Geometry objects.
 * 
 * @export
 * @constructor
 */
ol.geom.Geometry = function() {
    
    /**
     * @private
     * @type {ol.Bounds|undefined}
     */
    this.bounds_ = undefined;
};

/**
 * @return {ol.Bounds|undefined} The ol.Bounds.
 */
ol.geom.Geometry.prototype.getBounds = function() {
    return this.bounds_;
};

/**
 * @param {ol.Bounds} bounds The new ol.Bounds.
 * @return {ol.geom.Geometry} This.
 */
ol.geom.Geometry.prototype.setBounds = function(bounds) {
    this.bounds_ = bounds;
    return this;
};
