goog.provide('ol.renderer.Composite');

goog.require('ol.renderer.MapRenderer');
goog.require('ol.renderer.LayerRenderer');
goog.require('ol.layer.Layer');
goog.require('ol.Loc');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.math.Coordinate');

/**
 * @constructor
 * @param {!Element} container
 * @extends {ol.renderer.MapRenderer}
 */
ol.renderer.Composite = function(container) {
    
    goog.base(this, container);
    
    /**
     * @type {Array.<ol.renderer.LayerRenderer>}
     * @private
     */
    this.renderers_ = [];
    
    /**
     * Pixel buffer for renderer container.
     *
     * @type {number}
     * @private
     */
    this.buffer_ = 128;
    
    /**
     * @type {Element}
     * @private
     */
    this.target_ = null;

    /**
     * The current top left corner location of the target element (map coords).
     *
     * @type {ol.Loc}
     * @private
     */
    this.targetOrigin_ = null;

    /**
     * The pixel offset of the target element with respect to its container.
     *
     * @type {goog.math.Coordinate}
     * @private
     */
    this.targetOffset_ = null;
    
    /**
     * @type {Object}
     * @private
     */
    this.layerContainers_ = {};
    
};
goog.inherits(ol.renderer.Composite, ol.renderer.MapRenderer);

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 * @param {boolean} animate
 */
ol.renderer.Composite.prototype.draw = function(layers, center, resolution, animate) {
    if (goog.isNull(this.target_)) {
        // first rendering
        this.createTarget_(center, resolution);
    }
    
    // TODO: deal with layer order and removal

    if (this.renderedResolution_) {
        if (resolution !== this.renderedResolution_) {
            // TODO: apply transition to old target
            this.resetTarget_(center, resolution);
        }
    }
    this.renderedResolution_ = resolution;
    
    // shift target element to account for center change
    if (this.renderedCenter_) {
        this.shiftTarget_(center, resolution);
    }
    this.renderedCenter_ = center;

    // update each layer renderer
    var renderer;
    for (var i=0, ii=layers.length; i<ii; ++i) {
        renderer = this.getOrCreateRenderer_(layers[i], i);
        renderer.draw(center, resolution);
    }

};

/**
 * Create a new target element for layer renderer containers.
 *
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.Composite.prototype.createTarget_ = function(center, resolution) {
    this.targetOrigin_ = this.getOriginForCenterAndRes_(center, resolution);
    
    var containerSize = this.getContainerSize();
    var containerWidth = containerSize.width;
    var containerHeight = containerSize.height;
    var buffer = this.buffer_;
    
    var targetWidth = containerWidth + (2 * buffer);
    var targetHeight = containerHeight + (2 * buffer);
    var offset = new goog.math.Coordinate(-buffer, -buffer);

    var target = goog.dom.createDom('div', {
        'class': 'ol-renderer-composite',
        'style': 'width:' + targetWidth + 'px;height:' + targetHeight + 'px;' +
            'top:' + offset.y + 'px;left:' + offset.x + 'px;' +
            'position:absolute'
    });
    this.target_ = target;
    this.targetOffset_ = offset;
    this.renderedCenter_ = center;
    goog.dom.appendChild(this.container_, target);
};

/**
 * @param {ol.Loc} center
 * @param {number} resolution
 * @return {ol.Loc}
 */
ol.renderer.Composite.prototype.getOriginForCenterAndRes_ = function(center, resolution) {
    var containerSize = this.getContainerSize();
    var containerWidth = containerSize.width;
    var containerHeight = containerSize.height;
    var buffer = this.buffer_;
    var targetWidth = containerWidth + (2 * buffer);
    var targetHeight = containerHeight + (2 * buffer);
    return new ol.Loc(
        center.getX() - (resolution * targetWidth / 2),
        center.getY() + (resolution * targetHeight / 2)
    );
};

/**
 * Adjust the position of the renderer target given the new center.
 *
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.Composite.prototype.shiftTarget_ = function(center, resolution) {
    var oldCenter = this.renderedCenter_;
    var dx = Math.round((oldCenter.getX() - center.getX()) / resolution);
    var dy = Math.round((center.getY() - oldCenter.getY()) / resolution);
    if (!(dx == 0 && dy == 0)) {
        var offset = this.targetOffset_;
        offset.x += Math.round((oldCenter.getX() - center.getX()) / resolution);
        offset.y += Math.round((center.getY() - oldCenter.getY()) / resolution);
        goog.style.setPosition(this.target_, offset);
    }
};

/**
 * Reposition the target element back to the original offset.
 *
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.Composite.prototype.resetTarget_ = function(center, resolution) {
    this.targetOrigin_ = this.getOriginForCenterAndRes_(center, resolution);
    for (var i=0, ii=this.renderers_.length; i<ii; ++i) {
        this.renderers_[i].setContainerOrigin(this.targetOrigin_);
    }
    var offset = new goog.math.Coordinate(-this.buffer_, -this.buffer_);
    this.targetOffset_ = offset;
    this.renderedCenter_ = center;
    goog.style.setPosition(this.target_, offset);
};



/**
 * @param {ol.layer.Layer} layer
 * @param {number} index
 */
ol.renderer.Composite.prototype.getOrCreateRenderer_ = function(layer, index) {
    var renderer = this.getRenderer_(layer);
    if (goog.isNull(renderer)) {
        renderer = this.createRenderer_(layer);
        goog.array.insertAt(this.renderers_, renderer, index);
    }
    return renderer;
};

/**
 * @param {ol.layer.Layer} layer
 * @return {ol.renderer.LayerRenderer}
 */
ol.renderer.Composite.prototype.getRenderer_ = function(layer) {
    function finder(candidate) {
        return candidate.getLayer() === layer;
    }
    var renderer = goog.array.find(this.renderers_, finder);
    return /** @type {ol.renderer.LayerRenderer} */ renderer;
};

/**
 * @param {ol.layer.Layer} layer
 */
ol.renderer.Composite.prototype.createRenderer_ = function(layer) {
    var Renderer = this.pickRendererType(layer);
    goog.asserts.assert(Renderer, "No supported renderer for layer: " + layer);

    var container = goog.dom.createDom('div', {
        'class': 'ol-renderer-composite-layer',
        'style': 'width:100%;height:100%;top:0;left:0;position:absolute'
    });
    goog.dom.appendChild(this.target_, container);
    var renderer = new Renderer(container, layer);
    renderer.setContainerOrigin(this.targetOrigin_);
    this.layerContainers_[goog.getUid(renderer)] = container;
    return renderer;
};

/**
 * @param {ol.renderer.LayerRenderer} renderer
 * @return {Element}
 */
ol.renderer.Composite.prototype.getRendererContainer_ = function(renderer) {
    var container = this.layerContainers_[goog.getUid(renderer)];
    goog.asserts.assert(goog.isDef(container));
    return container;
};

/**
 * List of preferred renderer types.  Layer renderers have a getType method
 * that returns a string describing their type.  This list determines the 
 * preferences for picking a layer renderer.
 *
 * @type {Array.<string>}
 */
ol.renderer.Composite.preferredRenderers = ["svg", "canvas", "vml"];

/**
 * @param {ol.layer.Layer} layer
 * @returns {Function}
 */
ol.renderer.Composite.prototype.pickRendererType = function(layer) {
    // maps candidate renderer types to candidate renderers
    var types = {};

    function picker(Candidate) {
        var supports = Candidate['isSupported']() && Candidate['canRender'](layer);
        if (supports) {
            types[Candidate['getType']()] = Candidate;
        }
        return supports;
    }
    var Candidates = goog.array.filter(ol.renderer.Composite.registry_, picker);
    
    // check to see if any preferred renderers are available
    var preferences = ol.renderer.Composite.preferredRenderers;

    var Renderer;
    for (var i=0, ii=preferences.length; i<ii; ++i) {
        Renderer = types[preferences[i]];
        if (Renderer) {
            break;
        }
    }
    
    // if we didn't find any of the preferred renderers, use the first
    return Renderer || Candidates[0] || null;
};

/**
 * @type {Array.<Function>}
 * @private
 */
ol.renderer.Composite.registry_ = [];

/**
 * @param {Function} Renderer
 */
ol.renderer.Composite.register = function(Renderer) {
    ol.renderer.Composite.registry_.push(Renderer);
};

/**
 * return {string}
 */
ol.renderer.Composite.getType = function() {
    // TODO: revisit
    return "composite";
};

/**
 * TODO: determine if there is a better way to register these renderers
 *
 * @export
 * @return {boolean}
 */
ol.renderer.Composite.isSupported = function() {
    return true;
};

ol.renderer.MapRenderer.register(ol.renderer.Composite);
