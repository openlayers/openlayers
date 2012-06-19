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
    this.projection_ = new ol.Projection('EPSG:900913');

    /**
     * @private
     * @type {ol.Projection}
     */
    this.userProjection_ = new ol.Projection('EPSG:4326');

    /**
     * @private
     * @type {ol.Loc}
     */
    this.center_ = new ol.Loc(0, 0);

    /**
     * @private
     * @type {number}
     */
    this.zoom_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.numZoomLevels_ = 22;

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
 * @return {ol.Projection} Projection.
 */
ol.Map.prototype.getProjection = function() {
    if (!goog.isDef(this.projection_)) {
        this.projection_ = new ol.Projection(this.DEFAULT_PROJECTION);
    }
    return this.projection_;
};


/**
 * @return {ol.Projection} User projection.
 */
ol.Map.prototype.getUserProjection = function() {
    if (!goog.isDef(this.userProjection_)) {
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
*/
ol.Map.prototype.destroy = function() {
    //remove layers, etc.
};
