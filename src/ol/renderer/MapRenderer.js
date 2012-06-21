goog.provide('ol.renderer.MapRenderer');

/**
 * @constructor
 * @param {!Element} container
 */
ol.renderer.MapRenderer = function(container) {
    
    /**
     * @type !Element
     * @protected
     */
    this.container_ = container;
    
};

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 * @param {boolean} animate
 */
ol.renderer.MapRenderer.prototype.draw = function(layers, center, resolution, animate) {
};
