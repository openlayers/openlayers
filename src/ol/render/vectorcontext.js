/**
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @constructor
 * @abstract
 * @struct
 * @api
 */
var _ol_render_VectorContext_ = function() {
};


/**
 * Render a geometry with a custom renderer.
 *
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {Function} renderer Renderer.
 */
_ol_render_VectorContext_.prototype.drawCustom = function(geometry, feature, renderer) {};


/**
 * Render a geometry.
 *
 * @param {ol.geom.Geometry} geometry The geometry to render.
 */
_ol_render_VectorContext_.prototype.drawGeometry = function(geometry) {};


/**
 * Set the rendering style.
 *
 * @param {ol.style.Style} style The rendering style.
 */
_ol_render_VectorContext_.prototype.setStyle = function(style) {};


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawCircle = function(circleGeometry, feature) {};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
_ol_render_VectorContext_.prototype.drawFeature = function(feature, style) {};


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawGeometryCollection = function(geometryCollectionGeometry, feature) {};


/**
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawLineString = function(lineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {};


/**
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawMultiPoint = function(multiPointGeometry, feature) {};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {};


/**
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawPoint = function(pointGeometry, feature) {};


/**
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawPolygon = function(polygonGeometry, feature) {};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_VectorContext_.prototype.drawText = function(flatCoordinates, offset, end, stride, geometry, feature) {};


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
_ol_render_VectorContext_.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
_ol_render_VectorContext_.prototype.setImageStyle = function(imageStyle) {};


/**
 * @param {ol.style.Text} textStyle Text style.
 */
_ol_render_VectorContext_.prototype.setTextStyle = function(textStyle) {};
export default _ol_render_VectorContext_;
