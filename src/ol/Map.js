goog.provide('ol.Map');

goog.require('ol.Loc');
goog.require('ol.Projection');



/**
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
     * @type {number}
     */
    this.zoom_ = undefined;

    /**
     * @private
     * @type {number}
     */
    this.numZoomLevels_ = 22;

    /**
     * @private
     * @type {Array|undefined}
     */
    this.resolutions_ = null;

    /**
     * @private
     * @type {Array|undefined}
     */
    this.layers_ = null;

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
 * @return {ol.Loc} Location.
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
 * @return {number} Zoom.
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
 * @return {ol.Bounds} the maxExtent for the map
 */
ol.Map.prototype.getMaxExtent = function() {
    if (goog.isDefAndNotNull(this.maxExtent_)) {
        return this.maxExtent_;
    } else {
        var extent = this.getProjection().getExtent();
        if (goog.isDefAndNotNull(extent)) {
            return extent;
        } else {
            throw('maxExtent must be defined either in the map or the projection');
        }
    }
        
};


/**
 * @param {ol.Loc} center Center.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setCenter = function(center) {
    this.center_ = center;
    return this;
};


/**
 * @param {ol.Projection} projection Projection.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setProjection = function(projection) {
    this.projection_ = projection;
    return this;
};


/**
 * @param {ol.Projection} userProjection set the user projection.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setUserProjection = function(userProjection) {
    this.userProjection_ = userProjection;
    return this;
};


/**
 * @param {number} zoom Zoom.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setZoom = function(zoom) {
    this.zoom_ = zoom;
    return this;
};


/**
 * @param {number} nZoom Zoom.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setNumZoomLevels = function(nZoom) {
    this.numZoomLevels_ = nZoom;
    return this;
};

/**
 * @param {Array} resolutions the map resolutions if set on the map
 * @return {ol.Map} This.
 */
ol.Map.prototype.setResolutions = function(resolutions) {
    this.resolutions_ = resolutions;
    return this;
};

/**
 * @param {Array} layers the layers set on the map
 * @return {ol.Map} This.
 */
ol.Map.prototype.setLayers = function(layers) {
    this.layers_ = layers;
    return this;
};

/**
 * @param {ol.Bounds} extent the maxExtent for the map
 * @return {ol.Map} This.
 */
ol.Map.prototype.setMaxExtent = function(extent) {
    this.maxExtent_ = extent;
    return this;
};

/**
*/
ol.Map.prototype.destroy = function() {
    //remove layers, etc.
    for (var key in this) {
        delete this[key];
    }
};
