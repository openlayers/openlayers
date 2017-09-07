goog.provide('ol.render.VectorContext');


/**
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @constructor
 * @abstract
 * @struct
 * @api
 */
ol.render.VectorContext = function() {
};


/**
 * Render a geometry with a custom renderer.
 *
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {Function} renderer Renderer.
 */
ol.render.VectorContext.prototype.drawCustom = function(geometry, feature, renderer) {};


/**
 * Render a geometry.
 *
 * @param {ol.geom.Geometry} geometry The geometry to render.
 */
ol.render.VectorContext.prototype.drawGeometry = function(geometry) {};


/**
 * Set the rendering style.
 *
 * @param {ol.style.Style} style The rendering style.
 */
ol.render.VectorContext.prototype.setStyle = function(style) {};


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawCircle = function(circleGeometry, feature) {};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.VectorContext.prototype.drawFeature = function(feature, style) {};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawGeometryCollection = function(geometryCollectionGeometry, feature) {};


/**
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawLineString = function(lineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPoint = function(multiPointGeometry, feature) {};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {};


/**
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPoint = function(pointGeometry, feature) {};


/**
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPolygon = function(polygonGeometry, feature) {};


/**
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawText = function(geometry, feature) {};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.VectorContext.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.VectorContext.prototype.setImageStyle = function(imageStyle) {};


/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.VectorContext.prototype.setTextStyle = function(textStyle) {};
