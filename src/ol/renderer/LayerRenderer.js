goog.provide('ol.renderer.LayerRenderer');

goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');

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
     * @type {goog.math.Size}
     * @private
     */
    this.containerSize_ = null;

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
 * @return {goog.math.Size}
 * @protected
 */
ol.renderer.LayerRenderer.prototype.getContainerSize = function() {
    // TODO: listen for resize and set this.constainerSize_ null
    // https://github.com/openlayers/ol3/issues/2
    if (goog.isNull(this.containerSize_)) {
        this.containerSize_ = goog.style.getSize(this.container_);
    }
    return this.containerSize_;
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
