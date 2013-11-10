goog.provide('ol.render.IRender');



/**
 * @interface
 */
ol.render.IRender = function() {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 */
ol.render.IRender.prototype.drawPointGeometry = function(pointGeometry) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 */
ol.render.IRender.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     Multi line string geometry.
 */
ol.render.IRender.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 */
ol.render.IRender.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry Multi polygon geometry.
 */
ol.render.IRender.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 */
ol.render.IRender.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
};


/**
 * @param {?ol.style.Fill} fillStyle Fill style.
 * @param {?ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.IRender.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @param {?ol.style.Image} imageStyle Image style.
 */
ol.render.IRender.prototype.setImageStyle = function(imageStyle) {
};
