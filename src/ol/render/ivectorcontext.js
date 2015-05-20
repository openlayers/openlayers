// FIXME remove trailing "Geometry" in method names

goog.provide('ol.render.IVectorContext');



/**
 * VectorContext interface. Implemented by
 * {@link ol.render.canvas.Immediate} and {@link ol.render.webgl.Immediate}.
 * @interface
 */
ol.render.IVectorContext = function() {
};


/**
 * @param {number} zIndex Z index.
 * @param {function(ol.render.IVectorContext)} callback Callback.
 */
ol.render.IVectorContext.prototype.drawAsync = function(zIndex, callback) {
};


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature,
 */
ol.render.IVectorContext.prototype.drawCircleGeometry =
    function(circleGeometry, feature) {
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.IVectorContext.prototype.drawFeature = function(feature, style) {
};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, feature) {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawPointGeometry =
    function(pointGeometry, feature) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawLineStringGeometry =
    function(lineStringGeometry, feature) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, feature) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, feature) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, feature) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawPolygonGeometry =
    function(polygonGeometry, feature) {
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.IVectorContext.prototype.drawText =
    function(flatCoordinates, offset, end, stride, geometry, feature) {
};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.IVectorContext.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.IVectorContext.prototype.setImageStyle = function(imageStyle) {
};


/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.IVectorContext.prototype.setTextStyle = function(textStyle) {
};
