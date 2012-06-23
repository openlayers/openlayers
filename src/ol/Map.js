goog.provide('ol.Map');

goog.require('ol.Loc');
goog.require('ol.Bounds');
goog.require('ol.Projection');
goog.require('ol.event');
goog.require('ol.event.Events');
goog.require('ol.control.Control');
goog.require('ol.renderer.MapRenderer');

goog.require('goog.dom');
goog.require('goog.math');


/**
 * @export
 * @constructor
 */
ol.Map = function() {

    /**
     * @private
     * @type {ol.Projection}
     */
    this.projection_ = null;

    /**
     * @private
     * @type {ol.Projection}
     */
    this.userProjection_ = null;

    /**
     * @private
     * @type {ol.Loc}
     */
    this.center_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.zoom_ = undefined;

    /**
     * @private
     * @type {number}
     */
    this.numZoomLevels_ = 22;

    /**
     * @private
     * @type {Array}
     */
    this.resolutions_ = null;

    /**
     * @private
     * @type {Array}
     */
    this.layers_ = null;

    /**
     * @private
     * @type {Array}
     */
    this.controls_ = null;

    /**
     * @private
     * @type {ol.Bounds}
     */
    this.maxExtent_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.maxRes_ = undefined;
    
    /**
     * @private
     * @type {Element}
     */
    this.viewport_ = null;
    
    /**
     * @private
     * @type {Element}
     */
    this.mapOverlay_ = null;
    
    /**
     * @private
     * @type {Element}
     */
    this.staticOverlay_ = null;
    
    /**
     * @private
     * @type {ol.event.Events}
     */
    this.events_ = new ol.event.Events(
        this, undefined, false, ['drag', 'scroll']
    );
    
    /**
     * @private
     * @type {Element}
     */
    this.container_ = null;

};

/**
  @const
  @type {string}
*/
ol.Map.prototype.DEFAULT_PROJECTION = "EPSG:3857";
/**
  @const
  @type {string}
*/
ol.Map.prototype.DEFAULT_USER_PROJECTION = "EPSG:4326";
/**
  @const
  @type {number}
*/
ol.Map.ZOOM_FACTOR = 2;
/**
  @const
  @type {number}
*/
ol.Map.DEFAULT_TILE_SIZE = 256;
/**
  @const
  @type {Array.<string>}
 */
ol.Map.DEFAULT_CONTROLS = ["navigation", "zoom"];

/**
 * @return {ol.Loc} Map center in map projection.
 */
ol.Map.prototype.getCenter = function() {
    return this.center_;
};


/**
 * @return {!ol.Projection} Projection.
 */
ol.Map.prototype.getProjection = function() {
    if (goog.isNull(this.projection_)) {
        this.projection_ = new ol.Projection(this.DEFAULT_PROJECTION);
    }
    return this.projection_;
};


/**
 * @return {!ol.Projection} User projection.
 */
ol.Map.prototype.getUserProjection = function() {
    if (goog.isNull(this.userProjection_)) {
        this.userProjection_ = new ol.Projection(this.DEFAULT_USER_PROJECTION);
    }
    return this.userProjection_;
};


/**
 * @return {number|undefined} Zoom.
 */
ol.Map.prototype.getZoom = function() {
    return this.zoom_;
};


/**
 * @return {number} number of zoom levels.
 */
ol.Map.prototype.getNumZoomLevels = function() {
    return this.numZoomLevels_;
};


/**
 * @return {Array|undefined} array of resolutions available for this map
 */
ol.Map.prototype.getResolutions = function() {
    return this.resolutions_;
};


/**
 * @return {Array|undefined} array of layers available for this map
 */
ol.Map.prototype.getLayers = function() {
    return this.layers_;
};


/**
 * @return {Array.<ol.control.Control>}
 */
ol.Map.prototype.getControls = function() {
    return this.controls_;
};


/**
 * @return {ol.Bounds} the maxExtent for the map
 */
ol.Map.prototype.getMaxExtent = function() {
    if (goog.isDefAndNotNull(this.maxExtent_)) {
        return this.maxExtent_;
    } else {
        var projection = this.getProjection();
        var extent = projection.getExtent();
        if (goog.isDefAndNotNull(extent)) {
            extent = new ol.Bounds(
                extent.getMinX(), extent.getMinY(),
                extent.getMaxX(), extent.getMaxY());
            extent.setProjection(projection);
            return extent;
        } else {
            throw('maxExtent must be defined either in the map or the projection');
        }
    }
};


/**
 * @return {number} the max resolution for the map
 */
ol.Map.prototype.getMaxResolution = function() {
    if (goog.isDefAndNotNull(this.maxRes_)) {
        return this.maxRes_;
    } else {
        var extent = this.getMaxExtent();
        var dim = Math.max(
            (extent.getMaxX()-extent.getMinX()),
            (extent.getMaxY()-extent.getMinY())
         );
        return dim/ol.Map.DEFAULT_TILE_SIZE;
    }
};


/**
 * @param {number} zoom the zoom level being requested
 * @return {number} the resolution for the map at the given zoom level
 */
ol.Map.prototype.getResolutionForZoom = function(zoom) {
    if (goog.isDefAndNotNull(this.resolutions_)) {
        return this.resolutions_[zoom];
    } else {
        var maxRes = this.getMaxResolution();
        return maxRes/Math.pow(ol.Map.ZOOM_FACTOR, zoom);
    }
};


/**
 * @param {goog.math.Coordinate|{x: number, y: number}} pixel
 * @return {ol.Loc}
 */
ol.Map.prototype.getLocForPixel = function(pixel) {
    return goog.isDef(this.renderer_) ?
        this.renderer_.getLocForPixel(pixel) : null;
};

/**
 * @param {ol.Loc} loc
 * @return {{x: number, y: number}}
 */
ol.Map.prototype.getPixelForLoc = function(loc) {
    return goog.isDef(this.renderer_) ?
        this.renderer_.getPixelForLoc(loc) : null;
};

/**
 * @return {goog.math.Size} The currently rendered map size in pixels.
 */
ol.Map.prototype.getSize = function() {
    //TODO consider caching this when we have something like updateSize
    return goog.isDef(this.renderer_) ? this.renderer_.getSize() : null;
};


/**
 * @param {ol.Loc} center Center in map projection.
 */
ol.Map.prototype.setCenter = function(center) {
    this.center_ = center;
    this.conditionallyRender();
};


/**
 * @param {ol.Loc} center
 * @param {number} zoom
 */
ol.Map.prototype.setCenterAndZoom = function(center, zoom) {
    this.zoom_ = this.limitZoom(zoom);
    this.center_ = center;
    this.conditionallyRender();
};


/**
 * @param {number} zoom The zoom level to zoom to
 * @param {goog.math.Coordinate|{x: number, y: number}=} opt_anchor
 *     Optional anchor pixel for the zoom origin.
 */
ol.Map.prototype.setZoom = function(zoom, opt_anchor) {
    var currentZoom = this.zoom_,
        newZoom = this.limitZoom(zoom),
        newCenter;
    if (newZoom === currentZoom) {
        return;
    }
    if (goog.isDef(opt_anchor)) {
        var size = this.getSize(),
            anchorLoc = this.getLocForPixel(opt_anchor),
            newRes = this.getResolutionForZoom(newZoom);
        newCenter = new ol.Loc(
            anchorLoc.getX() + (size.width/2 - opt_anchor.x) * newRes,
            anchorLoc.getY() - (size.height/2 - opt_anchor.y) * newRes
        );
    } else {
        newCenter = this.center_;
    }
    this.setCenterAndZoom(newCenter, newZoom);
};


/**
 * @param {ol.Projection} projection Projection.
 */
ol.Map.prototype.setProjection = function(projection) {
    this.projection_ = projection;
};


/**
 * @param {ol.Projection} userProjection set the user projection.
 */
ol.Map.prototype.setUserProjection = function(userProjection) {
    this.userProjection_ = userProjection;
};


/**
 * @param {number} zoom
 * @return {number} zoom clamped to the range of available zoom levels.
 */
ol.Map.prototype.limitZoom = function(zoom) {
    return goog.math.clamp(zoom, 0, this.getNumZoomLevels()-1);
};


/**
 * @param {number} nZoom Zoom.
 */
ol.Map.prototype.setNumZoomLevels = function(nZoom) {
    this.numZoomLevels_ = nZoom;
};

/**
 * @param {Array} resolutions the map resolutions if set on the map
 */
ol.Map.prototype.setResolutions = function(resolutions) {
    this.resolutions_ = resolutions;
};

/**
 * @param {Array} layers the layers set on the map
 */
ol.Map.prototype.setLayers = function(layers) {
    this.layers_ = layers;
};

/**
 * @param {Array.<ol.control.Control>|undefined} opt_controls
 */
ol.Map.prototype.setControls = function(opt_controls) {
    if (!this.controls_) {
        var control;
        for (var i=0, ii=opt_controls.length; i<ii; ++i) {
            control = opt_controls[i];
            if (!(control instanceof ol.control.Control)) {
                control = new ol.control.CONTROL_MAP[control]();
            }
            control.setMap(this);
        }
        this.controls_ = opt_controls;
    }
};

/**
 * @param {ol.Bounds} extent the maxExtent for the map
 */
ol.Map.prototype.setMaxExtent = function(extent) {
    this.maxExtent_ = extent;
};

/**
 * @param {number} res the max resolution for the map
 */
ol.Map.prototype.setMaxResolution = function(res) {
    this.maxRes_ = res;
};

/**
 * @param {Element} container the container to render the map to
 */
ol.Map.prototype.setContainer = function(container) {
    this.container_ = container;
    this.setViewport();
    this.createRenderer();
    //TODO Controls could be set earlier, but we need to deal with content that
    // controls place on overlays.
    this.setControls(ol.Map.DEFAULT_CONTROLS);
    // conditionally render
    this.conditionallyRender();
};

/**
 * Check if everything is ready.  Render if so.
 */
ol.Map.prototype.conditionallyRender = function() {
    if (!goog.isNull(this.layers_) && goog.isDef(this.zoom_) && !goog.isNull(this.center_)) {
        this.renderer_.draw(this.layers_, this.center_, this.getResolutionForZoom(this.zoom_));
    }
};

/**
 * @return {Element}
 */
ol.Map.prototype.getViewport = function() {
    return this.viewport_;
};

ol.Map.prototype.setViewport = function() {
    if (!this.viewport_) {
        this.viewport_ = goog.dom.createDom('div', {
            'class': 'ol-viewport',
            'style': 'height:100%;width:100%;position:relative;top:0;left:0;overflow:hidden'
        });
        this.mapOverlay_ = goog.dom.createDom('div', 'ol-overlay-map');
        this.staticOverlay_ = goog.dom.createDom('div', 'ol-overlay-static');
        goog.dom.append(this.viewport_, this.mapOverlay_, this.staticOverlay_);
    }
    this.events_.setElement(this.viewport_);
    goog.dom.appendChild(this.container_, this.viewport_);
};

ol.Map.prototype.createRenderer = function() {
    var Renderer = ol.renderer.MapRenderer.pickRendererType(
        ol.Map.preferredRenderers);
    this.renderer_ = new Renderer(this.viewport_);
};

/**
 * @return {ol.event.Events} the events instance for this map
 */
ol.Map.prototype.getEvents = function() {
    return this.events_;
};

/**
 * @param {number} dx pixels to move in x direction
 * @param {number} dy pixels to move in x direction
 */
ol.Map.prototype.moveByPx = function(dx, dy) {
    if (!goog.isNull(this.center_) && goog.isDef(this.zoom_)) {
        var resolution = this.getResolutionForZoom(this.zoom_),
            center = new ol.Loc(
                this.center_.getX() - dx * resolution,
                this.center_.getY() + dy * resolution
            );
        this.setCenter(center);
    }
};

ol.Map.prototype.zoomIn = function() {
    this.setZoom(this.zoom_+1);
};

ol.Map.prototype.zoomOut = function() {
    this.setZoom(this.zoom_-1);
};

/**
 * @returns {Element} the map overlay element
 */
ol.Map.prototype.getMapOverlay = function() {
    return this.mapOverlay_;
};

/**
 * @export
 */
ol.Map.prototype.destroy = function() {
    //remove layers, etc.
    for (var key in this) {
        delete this[key];
    }
};


/**
 * List of preferred renderer types.  Map renderers have a getType method
 * that returns a string describing their type.  This list determines the 
 * preferences for picking a layer renderer.
 *
 * @type {Array.<string>}
 */
ol.Map.preferredRenderers = ["webgl", "canvas"];

