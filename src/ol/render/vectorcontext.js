goog.provide('ol.render.VectorContext');


/**
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @constructor
 * @struct
 * @api
 */
ol.render.VectorContext = function() {
};


/**
 * Render a geometry.
 *
 * @abstract
 * @param {ol.geom.Geometry} geometry The geometry to render.
 */
ol.render.VectorContext.prototype.drawGeometry = function(geometry) {};


/**
 * Set the rendering style.
 *
 * @abstract
 * @param {ol.style.Style} style The rendering style.
 */
ol.render.VectorContext.prototype.setStyle = function(style) {};


/**
 * @abstract
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature,
 */
ol.render.VectorContext.prototype.drawCircle = function(circleGeometry, feature) {};


/**
 * @abstract
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.VectorContext.prototype.drawFeature = function(feature, style) {};


/**
 * @abstract
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawGeometryCollection = function(geometryCollectionGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawLineString = function(lineStringGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPoint = function(multiPointGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPoint = function(pointGeometry, feature) {};


/**
 * @abstract
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPolygon = function(polygonGeometry, feature) {};


/**
 * @abstract
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawText = function(flatCoordinates, offset, end, stride, geometry, feature) {};


/**
 * @abstract
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.VectorContext.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


/**
 * @abstract
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.VectorContext.prototype.setImageStyle = function(imageStyle) {};


/**
 * @abstract
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.VectorContext.prototype.setTextStyle = function(textStyle) {};
