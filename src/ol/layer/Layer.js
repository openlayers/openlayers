goog.provide('ol.layer.Layer');

/**
 * @constructor
 * @export
 */
ol.layer.Layer = function() {
    
    /**
     * @type {string}
     * @protected
     */
    this.attribution_;
    
};

/**
 * @return {string}
 */
ol.layer.Layer.prototype.getAttribution = function() {
    return this.attribution_;
};
