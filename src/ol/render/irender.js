// FIXME remove trailing "Geometry" in method names

goog.provide('ol.render.IRender');



/**
 * @interface
 */
ol.render.IRender = function() {
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.IRender.prototype.drawFeature = function(feature, style) {
};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawPointGeometry = function(pointGeometry, data) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IRender.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.IRender.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.IRender.prototype.setImageStyle = function(imageStyle) {
};


/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.IRender.prototype.setTextStyle = function(textStyle) {
};
