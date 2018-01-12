/**
 * @module ol/render/VectorContext
 */
/**
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @constructor
 * @abstract
 * @struct
 * @api
 */
const VectorContext = function() {
};


/**
 * Render a geometry with a custom renderer.
 *
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {Function} renderer Renderer.
 */
VectorContext.prototype.drawCustom = function(geometry, feature, renderer) {};


/**
 * Render a geometry.
 *
 * @param {ol.geom.Geometry} geometry The geometry to render.
 */
VectorContext.prototype.drawGeometry = function(geometry) {};


/**
 * Set the rendering style.
 *
 * @param {ol.style.Style} style The rendering style.
 */
VectorContext.prototype.setStyle = function(style) {};


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature.
 */
VectorContext.prototype.drawCircle = function(circleGeometry, feature) {};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
VectorContext.prototype.drawFeature = function(feature, style) {};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
VectorContext.prototype.drawGeometryCollection = function(geometryCollectionGeometry, feature) {};


/**
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawLineString = function(lineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawMultiPoint = function(multiPointGeometry, feature) {};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {};


/**
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawPoint = function(pointGeometry, feature) {};


/**
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawPolygon = function(polygonGeometry, feature) {};


/**
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
VectorContext.prototype.drawText = function(geometry, feature) {};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
VectorContext.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


/**
 * @param {ol.style.Image} imageStyle Image style.
 * @param {ol.DeclutterGroup=} opt_declutterGroup Declutter.
 */
VectorContext.prototype.setImageStyle = function(imageStyle, opt_declutterGroup) {};


/**
 * @param {ol.style.Text} textStyle Text style.
 * @param {ol.DeclutterGroup=} opt_declutterGroup Declutter.
 */
VectorContext.prototype.setTextStyle = function(textStyle, opt_declutterGroup) {};
export default VectorContext;
