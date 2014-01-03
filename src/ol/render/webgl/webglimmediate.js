goog.provide('ol.render.webgl.Immediate');



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {ol.webgl.Context} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @struct
 */
ol.render.webgl.Immediate = function(context, pixelRatio) {
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.webgl.Immediate.prototype.drawFeature = function(feature, style) {
};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawPointGeometry =
    function(pointGeometry, data) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.webgl.Immediate.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.webgl.Immediate.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.webgl.Immediate.prototype.setImageStyle = function(imageStyle) {
};


/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.webgl.Immediate.prototype.setTextStyle = function(textStyle) {
};
