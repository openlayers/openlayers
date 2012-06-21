/**
 * @fileoverview WebGL based MapRenderer drawing all the supplied layers in OpenGL
 */

goog.provide('ol.renderer.WebGL');

goog.require('ol.renderer.MapRenderer');
goog.require('ol.layer.Layer');
goog.require('ol.Loc');

/**
 * Initialization of the native WebGL renderer (canvas, context, layers)
 * @constructor
 * @param {!Element} target
 * @extends {ol.renderer.MapRenderer}
 */
ol.renderer.WebGL = function(target) {
    
    /** @type {!Element} */
    var canvasEl = goog.dom.createDom('canvas',
        {style: 'width:100%;height:100%;'});


    var upgradeRedirector = function() {
      /** @type {!Element} */
      var upgradeLinkEl = goog.dom.createDom('a',
          {style: 'font-size:110%;display:block;width:100%;top:50%;' +
                'position:relative;text-align:center;color:#800000;' +
                'text-shadow:rgba(0,0,0,0.4) 0 0 6px;',
            href: 'http://get.webgl.org/'
          }, 'You need a WebGL-enabled browser to run this application.');
      goog.dom.append(/** @type {!Element} */ (divEl), upgradeLinkEl);
    };

    /**
     * @type {!we.gl.Context}
     */
    this.context = new we.gl.Context(canvasEl, null, upgradeRedirector);

    if (!goog.isDefAndNotNull(this.context)) return;
    
    goog.base(this, target);
    
    /**
     * @type Array.<ol.renderer.LayerRenderer>
     * @private
     */
    this.renderers_ = [];
    
};

goog.inherits(ol.renderer.WebGL, ol.renderer.MapRenderer);

/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.WebGL.prototype.draw = function(layers, center, resolution) {
};

/**
 * @param {ol.layer.Layer} layer
 */
ol.renderer.WebGL.prototype.getRenderer = function(layer) {
    function finder(candidate) {
        return candidate.getLayer() === layer;
    }
    return goog.array.find(this.renderers_, finder);
};

/**
 * @param {ol.layer.Layer} layer
 */
ol.renderer.WebGL.prototype.createRenderer = function(layer) {
};

/**
 * List of preferred renderer types.  Layer renderers have a getType method
 * that returns a string describing their type.  This list determines the 
 * preferences for picking a layer renderer.
 *
 * @type {Array.<string>}
 */
ol.renderer.WebGL.preferredRenderers = ["svg", "canvas", "vml"];

/**
 * @param {ol.layer.Layer} layer
 * @returns {Function}
 */
ol.renderer.WebGL.prototype.pickRendererType = function(layer) {
    // maps candidate renderer types to candidate renderers
    var types = {};

    function picker(Candidate) {
        var supports = Candidate.isSupported() && Candidate.canRender(layer);
        if (supports) {
            types[Candidate.getType()] = Candidate;
        }
        return supports;
    }
    var Candidates = goog.array.some(ol.renderer.WebGL.registry_, picker);
    
    // check to see if any preferred renderers are available
    var preferences = ol.renderer.WebGL.preferredRenderers;

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
ol.renderer.WebGL.registry_ = [];

/**
 * @param {Function} Renderer
 */
ol.renderer.WebGL.register = function(Renderer) {
    ol.renderer.WebGL.registry_.push(Renderer);
};
