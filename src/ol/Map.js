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
     * @type {ol.UnreferencedBounds}
     */
    this.maxExtent_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.maxRes_ = undefined;

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
 * @return {ol.Loc} Location.
 */
ol.Map.prototype.getCenter = function() {
    var proj = this.getUserProjection();
    this.center_ = this.center_.transform(proj);
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
 * @return {ol.UnreferencedBounds} the maxExtent for the map
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
    this.center_ = center.transform(this.getProjection());
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
 * @param {ol.UnreferencedBounds} extent the maxExtent for the map
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
*/
ol.Map.prototype.destroy = function() {
    //remove layers, etc.
    for (var key in this) {
        delete this[key];
    }
};
