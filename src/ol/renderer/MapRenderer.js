goog.provide('ol.renderer.MapRenderer');

goog.require('goog.style');
goog.require('goog.math.Size');

/**
 * @constructor
 * @param {!Element} container
 */
ol.renderer.MapRenderer = function(container) {
    
    /**
     * @type !Element
     * @protected
     */
    this.container_ = container;

    /**
     * @type {goog.math.Size}
     * @private
     */
    this.containerSize_ = null;
    
    /**
     * @type {ol.Loc}
     * @protected
     */
    this.renderedCenter_;
    
    /**
     * @type {number}
     * @protected
     */
    this.renderedResolution_;
    
};

/**
 * @return {goog.math.Size}
 * @protected
 */
ol.renderer.MapRenderer.prototype.getContainerSize = function() {
    // TODO: listen for resize and set this.constainerSize_ null
    // https://github.com/openlayers/ol3/issues/2
    if (goog.isNull(this.containerSize_)) {
        this.containerSize_ = goog.style.getSize(this.container_);
    }
    return this.containerSize_;
};


/**
 * @param {Array.<ol.layer.Layer>} layers
 * @param {ol.Loc} center
 * @param {number} resolution
 * @param {boolean} animate
 */
ol.renderer.MapRenderer.prototype.draw = function(layers, center, resolution, animate) {
};

/**
 * @return {number} The rendered resolution.
 */
ol.renderer.MapRenderer.prototype.getResolution = function() {
    return this.renderedResolution_;
};

/**
 * TODO: determine a closure friendly way to register map renderers.
 * @type {Array}
 * @private
 */
ol.renderer.MapRenderer.registry_ = [];

/**
 * @param {Function} Renderer
 */
ol.renderer.MapRenderer.register = function(Renderer) {
    ol.renderer.MapRenderer.registry_.push(Renderer);
};

/**
 * @param {Array.<string>} preferences List of preferred renderer types.
 * @returns {Function} A renderer constructor.
 */
ol.renderer.MapRenderer.pickRendererType = function(preferences) {
    // map of candidate renderer types to candidate renderers
    var types = {};

    function picker(Candidate) {
        var supports = Candidate.isSupported();
        if (supports) {
            types[Candidate.getType()] = Candidate;
        }
        return supports;
    }
    var Candidates = goog.array.filter(ol.renderer.MapRenderer.registry_, picker);
    
    // check to see if any preferred renderers are available
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
 * @param {goog.math.Coordinate|{x: number, y: number}} pixel
 * @return {ol.Loc}
 */
ol.renderer.MapRenderer.prototype.getLocForPixel = function(pixel) {
    var center = this.renderedCenter_,
        resolution = this.renderedResolution_,
        size = goog.style.getSize(this.container_);
    return center.add(
        (pixel.x - size.width/2) * resolution,
        (size.height/2 - pixel.y) * resolution
    );
};

/**
 * @param {ol.Loc} loc
 * @return {{x: number, y: number}}
 */
ol.renderer.MapRenderer.prototype.getPixelForLoc = function(loc) {
    var center = this.renderedCenter_,
        resolution = this.renderedResolution_,
        size = this.getSize();
    return {
        x: (size.width*resolution/2 + loc.getX() - center.getX())/resolution,
        y: (size.height*resolution/2 - loc.getY() + center.getY())/resolution
    };
};

/**
 * @return {goog.math.Size} The currently rendered map size in pixels.
 */
ol.renderer.MapRenderer.prototype.getSize = function() {
    return goog.style.getSize(this.container_);
};
