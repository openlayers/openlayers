goog.provide('ol.renderer.MapRenderer');

/**
 * @constructor
 * @param {!Element} target
 */
ol.renderer.MapRenderer = function(target) {
    
    /**
     * @type !Element
     * @private
     */
    this.target_ = target;
    
};

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.MapRenderer.prototype.draw = function(layers, center, resolution) {
};
