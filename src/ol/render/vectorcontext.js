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
 * @param {ol.geom.Geometry} geometry The geometry to render.
 */
ol.render.VectorContext.prototype.drawGeometry = goog.abstractMethod;


/**
 * Set the rendering style.
 *
 * @param {ol.style.Style} style The rendering style.
 */
ol.render.VectorContext.prototype.setStyle = goog.abstractMethod;


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature,
 */
ol.render.VectorContext.prototype.drawCircle = goog.abstractMethod;


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.style.Style} style Style.
 */
ol.render.VectorContext.prototype.drawFeature = goog.abstractMethod;


/**
 * @param {ol.geom.GeometryCollection} geometryCollectionGeometry Geometry
 *     collection.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawGeometryCollection = goog.abstractMethod;


/**
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawLineString = goog.abstractMethod;


/**
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiLineString = goog.abstractMethod;


/**
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPoint = goog.abstractMethod;


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPolygon = goog.abstractMethod;


/**
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPoint = goog.abstractMethod;


/**
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPolygon = goog.abstractMethod;


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawText = goog.abstractMethod;


/**
 * @param {ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.VectorContext.prototype.setFillStrokeStyle = goog.abstractMethod;


/**
 * @param {ol.style.Image} imageStyle Image style.
 */
ol.render.VectorContext.prototype.setImageStyle = goog.abstractMethod;


/**
 * @param {ol.style.Text} textStyle Text style.
 */
ol.render.VectorContext.prototype.setTextStyle = goog.abstractMethod;
