goog.provide('ol.renderer.Composite');

goog.require('ol.renderer.MapRenderer');
goog.require('ol.layer.Layer');
goog.require('ol.Loc');

/**
 * @constructor
 * @param {!Element} target
 * @extends {ol.renderer.MapRenderer}
 */
ol.renderer.Composite = function(target) {
    
    goog.base(this, target);
    
    /**
     * @type Array.<ol.renderer.LayerRenderer>
     * @private
     */
    this.renderers_ = [];
    
};

goog.inherits(ol.renderer.Composite, ol.renderer.MapRenderer);

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.Composite.prototype.draw = function(layers, center, resolution) {
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
    var Candidates = goog.array.some(ol.renderer.Composite.registry_, picker);
    
    // check to see if any preferred renderers are available
    var preferences = ol.renderer.Composite.preferredRenderers;

    var Renderer;
    for (var i=0, ii=preferences.length; i<ii; ++i) {
        Renderer = preferences[i];
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
