goog.provide('ol.Map');

goog.require('ol.Loc');
goog.require('ol.Bounds');
goog.require('ol.Projection');
goog.require('ol.event');
goog.require('ol.event.Events');
goog.require('ol.control.Control');
goog.require('goog.dom');



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
        this, undefined, false, ['drag']
    );
    
    /**
     * @private
     * @type {Element}
     */
    this.container_ = null;
    
    this.setControls(ol.Map.DEFAULT_CONTROLS);
    
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
ol.Map.DEFAULT_CONTROLS = ["navigation"];

/**
 * @return {ol.Loc} Location.
 */
ol.Map.prototype.getCenter = function() {
    var proj = this.getUserProjection();
    return this.center_.doTransform(proj);
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
ol.Map.prototype.getMaxRes = function() {
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
        var maxRes = this.getMaxRes();
        return maxRes/Math.pow(ol.Map.ZOOM_FACTOR, zoom);
    }
};


/**
 * @param {ol.Loc} center Center.
 */
ol.Map.prototype.setCenter = function(center) {
    var proj = center.getProjection();
    if (goog.isNull(proj)) {
        proj = this.getUserProjection();
        center.setProjection(proj);
    }
    this.center_ = center.doTransform(this.getProjection());
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
 * @param {number} zoom Zoom.
 */
ol.Map.prototype.setZoom = function(zoom) {
    this.zoom_ = zoom;
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
ol.Map.prototype.setMaxRes = function(res) {
    this.maxRes_ = res;
};

/**
 * @param {Element} container the container to render the map to
 */
ol.Map.prototype.setContainer = function(container) {
    this.events_.setElement(container);
    this.container_ = container;
    this.setViewport();
};

ol.Map.prototype.setViewport = function() {
    if (!this.viewport_) {
        this.viewport_ = goog.dom.createDom('div', 'ol-viewport');
        this.mapOverlay_ = goog.dom.createDom('div', 'ol-overlay-map');
        this.staticOverlay_ = goog.dom.createDom('div', 'ol-overlay-static');
        goog.dom.append(this.viewport_, this.mapOverlay_, this.staticOverlay_);
    }
    goog.dom.appendChild(this.container_, this.viewport_);
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
    // call moveByPx on renderers
};

/**
 * @param {ol.geom.Point} loc the location being requested 
 * @returns {Array} the position of the location in pixel space
 */
ol.Map.prototype.getViewportPosition = function(loc) {
    //TODO: delegate this to the renderers
    //stub for now to get popups working
    return [200, 300];
};

/**
 * @returns {Element} the map overlay element
 */
ol.Map.prototype.getMapOverlay = function() {
    return this.mapOverlay_
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
