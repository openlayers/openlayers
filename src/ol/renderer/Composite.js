goog.provide('ol.renderer.Composite');

goog.require('ol.renderer.MapRenderer');
goog.require('ol.renderer.LayerRenderer');
goog.require('ol.layer.Layer');
goog.require('ol.Loc');
goog.require('goog.array');

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
    
    var target = document.createElement("div");
    target.className = "ol-renderer-composite";
    target.style.position = "absolute";
    target.style.height = "100%";
    target.style.width = "100%";
    container.appendChild(target);

    /**
     * @type Element
     * @private
     */
    this.target_ = target;
    
};

goog.inherits(ol.renderer.Composite, ol.renderer.MapRenderer);

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 * @param {boolean} animate
 */
ol.renderer.Composite.prototype.draw = function(layers, center, resolution, animate) {
    // TODO: deal with layer order and removal
    for (var i=0, ii=layers.length; i<ii; ++i) {
        this.getOrCreateRenderer(layers[i], i).draw(center, resolution);
    }
    this.renderedCenter_ = center;
    this.renderedResolution_ = resolution;
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
 */
ol.renderer.Composite.prototype.getRenderer = function(layer) {
    function finder(candidate) {
        return candidate.getLayer() === layer;
    }
    return goog.array.find(this.renderers_, finder);
};

/**
 * @param {ol.layer.Layer} layer
 */
ol.renderer.Composite.prototype.createRenderer = function(layer) {
    var Renderer = this.pickRendererType(layer);
    goog.asserts.assert(Renderer, "No supported renderer for layer: " + layer);
    return new Renderer(this.target_, layer);
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
        var supports = Candidate.isSupported() && Candidate.canRender(layer);
        if (supports) {
            types[Candidate.getType()] = Candidate;
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
 * return {boolean}
 */
ol.renderer.Composite.isSupported = function() {
    return true;
};

ol.renderer.MapRenderer.register(ol.renderer.Composite);
