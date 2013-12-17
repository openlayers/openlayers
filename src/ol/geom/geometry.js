goog.provide('ol.geom.Geometry');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Observable');


/**
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection'
};


/**
 * @enum {string}
 */
ol.geom.GeometryLayout = {
  XY: 'XY',
  XYZ: 'XYZ',
  XYM: 'XYM',
  XYZM: 'XYZM'
};



/**
 * @constructor
 * @extends {ol.Observable}
 */
ol.geom.Geometry = function() {

  goog.base(this);

  /**
   * @protected
   * @type {number}
   */
  this.revision = 0;

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
 * @return {ol.geom.Geometry} Clone.
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
 * FIXME empty description for jsdoc
 */
ol.geom.Geometry.prototype.dispatchChangeEvent = function() {
  ++this.revision;
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} extent Extent.
 */
ol.geom.Geometry.prototype.getExtent = goog.abstractMethod;


/**
 * @return {number} Revision.
 */
ol.geom.Geometry.prototype.getRevision = function() {
  return this.revision;
};


/**
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.Geometry} Simplified geometry.
 */
ol.geom.Geometry.prototype.getSimplifiedGeometry = goog.abstractMethod;


/**
 * @return {ol.geom.GeometryType} Geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * @param {ol.TransformFunction} transformFn Transform.
 */
ol.geom.Geometry.prototype.transform = goog.abstractMethod;


/**
 * @typedef {ol.Coordinate}
 */
ol.geom.RawPoint;


/**
 * @typedef {Array.<ol.Coordinate>}
 */
ol.geom.RawLineString;


/**
 * @typedef {Array.<ol.Coordinate>}
 *
 */
ol.geom.RawLinearRing;


/**
 * @typedef {Array.<ol.geom.RawLinearRing>}
 */
ol.geom.RawPolygon;


/**
 * @typedef {Array.<ol.geom.RawPoint>}
 */
ol.geom.RawMultiPoint;


/**
 * @typedef {Array.<ol.geom.RawLineString>}
 */
ol.geom.RawMultiLineString;


/**
 * @typedef {Array.<ol.geom.RawPolygon>}
 */
ol.geom.RawMultiPolygon;
