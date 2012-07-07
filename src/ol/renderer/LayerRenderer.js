goog.provide('ol.renderer.LayerRenderer');

goog.require('goog.math.Coordinate');

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
     * Pixel offset between the layer renderer container and the composite
     * renderer container.  These will always be integer values.
     * 
     * @type {goog.math.Coordinate}
     * @protected
     */
    this.containerOffset_ = new goog.math.Coordinate(0, 0);

    /**
     * @type {!ol.layer.Layer}
     * @protected
     */
    this.layer_ = layer;

};

/**
 * Set the pixel offset between the layer renderer container and the composite
 * renderer container.
 *
 * @param {goog.math.Coordinate} offset Integer pixel offset.
 */
ol.renderer.LayerRenderer.prototype.setContainerOffset = function(offset) {
    this.containerOffset_ = offset;
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
