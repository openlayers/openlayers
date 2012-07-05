goog.provide('ol.renderer.LayerRenderer');

/**
 * A single layer renderer that will be created by the composite map renderer.
 *
 * @constructor
 * @param {!Element} container
 * @param {!ol.layer.Layer} layer
 */
ol.renderer.LayerRenderer = function(container, layer) {
    
    /**
     * @type {!Element}
     * @protected
     */
    this.container_ = container;

    /**
     * @type {!ol.layer.Layer}
     * @protected
     */
    this.layer_ = layer;

};

/**
 * Get layer being rendered.
 *
 * @returns {!ol.layer.Layer}
 */
ol.renderer.LayerRenderer.prototype.getLayer = function() {
    return this.layer_;
};

/**
 * Get an identifying string for this renderer.
 *
 * @returns {string|undefined}
 */
ol.renderer.LayerRenderer.prototype.getType = function() {};

/**
 * Determine if this renderer is supported in the given environment.
 *
 * @returns {boolean}
 */
ol.renderer.LayerRenderer.isSupported = function() {
    return false;
};

/**
 * Determine if this renderer is capable of renderering the given layer.
 *
 * @param {ol.layer.Layer} layer
 * @returns {boolean}
 */
ol.renderer.LayerRenderer.canRender = function(layer) {
    return false;
};
