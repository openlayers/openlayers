goog.provide('ol.geom.Geometry');
goog.provide('ol.geom.GeometryType');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.Observable');
goog.require('ol.proj');


/**
 * The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, `'Circle'`.
 * @enum {string}
 * @api stable
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle'
};


/**
 * The coordinate layout for geometries, indicating whether a 3rd or 4th z ('Z')
 * or measure ('M') coordinate is available. Supported values are `'XY'`,
 * `'XYZ'`, `'XYM'`, `'XYZM'`.
 * @enum {string}
 * @api stable
 */
ol.geom.GeometryLayout = {
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
};



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for vector geometries.
 *
 * @constructor
 * @extends {ol.Observable}
 * @fires change Triggered when the geometry changes.
 * @api stable
 */
ol.geom.Geometry = function() {

  goog.base(this);

  /**
   * @protected
   * @type {ol.Extent|undefined}
   */
  this.extent = undefined;

  /**
   * @protected
   * @type {number}
   */
  this.extentRevision = -1;

  /**
   * @protected
   * @type {Object.<string, ol.geom.Geometry>}
   */
  this.simplifiedGeometryCache = {};

  /**
   * @protected
   * @type {number}
   */
  this.simplifiedGeometryMaxMinSquaredTolerance = 0;

  /**
   * @protected
   * @type {number}
   */
  this.simplifiedGeometryRevision = 0;

};
goog.inherits(ol.geom.Geometry, ol.Observable);


/**
 * Make a complete copy of the geometry.
 * @function
 * @return {!ol.geom.Geometry} Clone.
 * @api stable
 */
ol.geom.Geometry.prototype.clone = goog.abstractMethod;


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @param {ol.Coordinate} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @return {number} Minimum squared distance.
 */
ol.geom.Geometry.prototype.closestPointXY = goog.abstractMethod;


/**
 * @param {ol.Coordinate} point Point.
 * @param {ol.Coordinate=} opt_closestPoint Closest point.
 * @return {ol.Coordinate} Closest point.
 * @api stable
 */
ol.geom.Geometry.prototype.getClosestPoint = function(point, opt_closestPoint) {
  var closestPoint = goog.isDef(opt_closestPoint) ?
      opt_closestPoint : [NaN, NaN];
  this.closestPointXY(point[0], point[1], closestPoint, Infinity);
  return closestPoint;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains coordinate.
 */
ol.geom.Geometry.prototype.containsCoordinate = function(coordinate) {
  return this.containsXY(coordinate[0], coordinate[1]);
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
ol.geom.Geometry.prototype.containsXY = goog.functions.FALSE;


/**
 * Get the extent of the geometry.
 * @function
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} extent Extent.
 * @api stable
 */
ol.geom.Geometry.prototype.getExtent = goog.abstractMethod;


/**
 * Create a simplified version of this geometry using the Douglas Peucker
 * algorithm.
 * @see http://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
 * @function
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.Geometry} Simplified geometry.
 */
ol.geom.Geometry.prototype.getSimplifiedGeometry = goog.abstractMethod;


/**
 * Get the type of this geometry.
 * @function
 * @return {ol.geom.GeometryType} Geometry type.
 * @api stable
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * Apply a transform function to the geometry.  Modifies the geometry in place.
 * If you do not want the geometry modified in place, first clone() it and
 * then use this function on the clone.
 * @function
 * @param {ol.TransformFunction} transformFn Transform.
 * @api stable
 */
ol.geom.Geometry.prototype.applyTransform = goog.abstractMethod;


/**
 * Transform a geometry from one coordinate reference system to another.
 * Modifies the geometry in place.
 * If you do not want the geometry modified in place, first clone() it and
 * then use this function on the clone.
 *
 * @param {ol.proj.ProjectionLike} source The current projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @param {ol.proj.ProjectionLike} destination The desired projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @return {ol.geom.Geometry} This geometry.  Note that original geometry is
 *     modified in place.
 * @api stable
 */
ol.geom.Geometry.prototype.transform = function(source, destination) {
  this.applyTransform(ol.proj.getTransform(source, destination));
  return this;
};
