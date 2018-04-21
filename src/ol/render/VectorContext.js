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
 * @param {module:ol/geom/SimpleGeometry~SimpleGeometry} geometry Geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 * @param {Function} renderer Renderer.
 */
VectorContext.prototype.drawCustom = function(geometry, feature, renderer) {};


/**
 * Render a geometry.
 *
 * @param {module:ol/geom/Geometry~Geometry} geometry The geometry to render.
 */
VectorContext.prototype.drawGeometry = function(geometry) {};


/**
 * Set the rendering style.
 *
 * @param {module:ol/style/Style~Style} style The rendering style.
 */
VectorContext.prototype.setStyle = function(style) {};


/**
 * @param {module:ol/geom/Circle~Circle} circleGeometry Circle geometry.
 * @param {module:ol/Feature~Feature} feature Feature.
 */
VectorContext.prototype.drawCircle = function(circleGeometry, feature) {};


/**
 * @param {module:ol/Feature~Feature} feature Feature.
 * @param {module:ol/style/Style~Style} style Style.
 */
VectorContext.prototype.drawFeature = function(feature, style) {};


/**
 * @param {module:ol/geom/GeometryCollection~GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {module:ol/Feature~Feature} feature Feature.
 */
VectorContext.prototype.drawGeometryCollection = function(geometryCollectionGeometry, feature) {};


/**
 * @param {module:ol/geom/LineString~LineString|module:ol/render/Feature~RenderFeature} lineStringGeometry Line string geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawLineString = function(lineStringGeometry, feature) {};


/**
 * @param {module:ol/geom/MultiLineString~MultiLineString|module:ol/render/Feature~RenderFeature} multiLineStringGeometry MultiLineString geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {};


/**
 * @param {module:ol/geom/MultiPoint~MultiPoint|module:ol/render/Feature~RenderFeature} multiPointGeometry MultiPoint geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawMultiPoint = function(multiPointGeometry, feature) {};


/**
 * @param {module:ol/geom/MultiPolygon~MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {};


/**
 * @param {module:ol/geom/Point~Point|module:ol/render/Feature~RenderFeature} pointGeometry Point geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawPoint = function(pointGeometry, feature) {};


/**
 * @param {module:ol/geom/Polygon~Polygon|module:ol/render/Feature~RenderFeature} polygonGeometry Polygon geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawPolygon = function(polygonGeometry, feature) {};


/**
 * @param {module:ol/geom/Geometry~Geometry|module:ol/render/Feature~RenderFeature} geometry Geometry.
 * @param {module:ol/Feature~Feature|module:ol/render/Feature~RenderFeature} feature Feature.
 */
VectorContext.prototype.drawText = function(geometry, feature) {};


/**
 * @param {module:ol/style/Fill~Fill} fillStyle Fill style.
 * @param {module:ol/style/Stroke~Stroke} strokeStyle Stroke style.
 */
VectorContext.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


/**
 * @param {module:ol/style/Image~ImageStyle} imageStyle Image style.
 * @param {module:ol/render/canvas~DeclutterGroup=} opt_declutterGroup Declutter.
 */
VectorContext.prototype.setImageStyle = function(imageStyle, opt_declutterGroup) {};


/**
 * @param {module:ol/style/Text~Text} textStyle Text style.
 * @param {module:ol/render/canvas~DeclutterGroup=} opt_declutterGroup Declutter.
 */
VectorContext.prototype.setTextStyle = function(textStyle, opt_declutterGroup) {};
export default VectorContext;
