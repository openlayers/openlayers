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
    
    var containerSize = this.getContainerSize();
    var width = containerSize.width + (2 * this.buffer_);
    var height = containerSize.height + (2 * this.buffer_);

    var target = goog.dom.createDom('div', {
        'class': 'ol-renderer-composite',
        'style': 'width:' + width + 'px;height:' + height + 'px;' +
            'top:-' + this.buffer_ + 'px;left:-' + this.buffer_ + 'px;' +
            'position:absolute'
    });
    goog.dom.appendChild(container, target);

    /**
     * @type {Element}
     * @private
     */
    this.target_ = target;

    /**
     * The cumulative offset from the original position of the target element.
     *
     * @type {goog.math.Coordinate}
     * @private
     */
    this.targetOffset_ = new goog.math.Coordinate(0, 0);
    
    /**
     * @type {Object}
     * @private
     */
    this.layerContainers_ = {};
    
};
goog.inherits(ol.renderer.Composite, ol.renderer.MapRenderer);

/**
 * Adjust the position of the renderer target by some offset.
 *
 * @param {number} x The x-offset (in pixel space)
 * @param {number} y The y-offset (in pixel space)
 */
ol.renderer.Composite.prototype.shiftTarget = function(x, y) {
    var newX = this.targetOffset_.x + x;
    var newY = this.targetOffset_.y + y;
    this.targetOffset_ = new goog.math.Coordinate(newX, newY);
    goog.style.setPosition(this.target_, newX-this.buffer_, newY-this.buffer_);
};

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 * @param {boolean} animate
 */
ol.renderer.Composite.prototype.draw = function(layers, center, resolution, animate) {
    // TODO: deal with layer order and removal

    if (this.renderedResolution_) {
        if (resolution !== this.renderedResolution_) {
            // TODO: apply transition to old target
            this.shiftTarget(0, 0);
        }
    }
    this.renderedResolution_ = resolution;
    
    // shift target element to account for center change
    if (this.renderedCenter_) {
        this.shiftTarget(
            Math.round((this.renderedCenter_.getX() - center.getX()) / resolution),
            Math.round((center.getY() - this.renderedCenter_.getY()) / resolution)
        );
    }
    this.renderedCenter_ = center;

    // update each layer renderer
    var renderer, container;

    for (var i=0, ii=layers.length; i<ii; ++i) {
        renderer = this.getOrCreateRenderer(layers[i]);
        renderer.setContainerOffset(this.targetOffset_);
        renderer.draw(center, resolution);
    }

};



/**
 * @param {ol.layer.Layer} layer
 * @param {number} index
 */
ol.renderer.Composite.prototype.getOrCreateRenderer = function(layer, index) {
    var renderer = this.getRenderer(layer);
    if (goog.isNull(renderer)) {
        renderer = this.createRenderer(layer);
        goog.array.insertAt(this.renderers_, renderer, index);
    }
    return renderer;
};

/**
 * @param {ol.layer.Layer} layer
 * @return {ol.renderer.LayerRenderer}
 */
ol.renderer.Composite.prototype.getRenderer = function(layer) {
    function finder(candidate) {
        return candidate.getLayer() === layer;
    }
    return goog.array.find(this.renderers_, finder);
};

/**
 * @param {ol.renderer.LayerRenderer}
 * @return {Element}
 */
ol.renderer.Composite.prototype.getRendererContainer = function(renderer) {
    var container = this.layerContainers_[goog.getUid(renderer)];
    goog.asserts.assert(goog.isDef(container));
    return container;
};

/**
 * @param {ol.layer.Layer} layer
 */
ol.renderer.Composite.prototype.createRenderer = function(layer) {
    var Renderer = this.pickRendererType(layer);
    goog.asserts.assert(Renderer, "No supported renderer for layer: " + layer);

    var container = goog.dom.createDom('div', {
        'class': 'ol-renderer-composite-layer',
        'style': 'width:100%;height:100%;top:0;left:0;position:absolute'
    });
    goog.dom.appendChild(this.target_, container);
    var renderer = new Renderer(container, layer);
    this.layerContainers_[goog.getUid(renderer)] = container;
    return renderer;
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
