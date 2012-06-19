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
    this.projection_ = new ol.Projection();

    /**
     * @private
     * @type {ol.Loc}
     */
    this.location_ = new ol.Loc(0, 0);

    /**
     * @private
     * @type {number}
     */
    this.zoom_ = 0;

};


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
    return this.projection_;
};


/**
 * @return {number} Zoom.
 */
ol.Map.prototype.getZoom = function() {
    return this.zoom_;
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
 * @param {number} zoom Zoom.
 * @return {ol.Map} This.
 */
ol.Map.prototype.setZoom = function(zoom) {
    this.zoom_ = zoom;
    return this;
};
