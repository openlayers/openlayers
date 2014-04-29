// FIXME remove trailing "Geometry" in method names

goog.provide('ol.render.IVectorContext');



/**
 * VectorContext interface. Currently implemented by
 * {@link ol.render.canvas.Immediate}
 * @interface
 */
ol.render.IVectorContext = function() {
};


/**
 * @param {number} zIndex Z index.
 * @param {function(ol.render.canvas.Immediate)} callback Callback.
 */
ol.render.IVectorContext.prototype.drawAsync = function(zIndex, callback) {
};


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {Object} data Opaque data object,
 */
ol.render.IVectorContext.prototype.drawCircleGeometry =
    function(circleGeometry, data) {
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
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawPointGeometry =
    function(pointGeometry, data) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.IVectorContext.prototype.drawText =
    function(flatCoordinates, offset, end, stride, geometry, data) {
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
