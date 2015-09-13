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
 * @param {number} zIndex Z index.
 * @param {function(ol.render.VectorContext)} callback Callback.
 */
ol.render.VectorContext.prototype.drawAsync = goog.abstractMethod;


/**
 * @param {ol.geom.Circle} circleGeometry Circle geometry.
 * @param {ol.Feature} feature Feature,
 */
ol.render.VectorContext.prototype.drawCircleGeometry = goog.abstractMethod;


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
ol.render.VectorContext.prototype.drawGeometryCollectionGeometry =
    goog.abstractMethod;


/**
 * @param {ol.geom.LineString|ol.render.Feature} lineStringGeometry Line
 *     string geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawLineStringGeometry =
    goog.abstractMethod;


/**
 * @param {ol.geom.MultiLineString|ol.render.Feature} multiLineStringGeometry
 *     MultiLineString geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @param {ol.geom.MultiPoint|ol.render.Feature} multiPointGeometry MultiPoint
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPointGeometry = goog.abstractMethod;


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod;


/**
 * @param {ol.geom.Point|ol.render.Feature} pointGeometry Point geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPointGeometry = goog.abstractMethod;


/**
 * @param {ol.geom.Polygon|ol.render.Feature} polygonGeometry Polygon
 *     geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.VectorContext.prototype.drawPolygonGeometry = goog.abstractMethod;


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
