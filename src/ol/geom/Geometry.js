/**
 * @module ol/geom/Geometry
 */
import {inherits} from '../index.js';
import _ol_Object_ from '../Object.js';
import _ol_extent_ from '../extent.js';
import _ol_functions_ from '../functions.js';
import _ol_geom_flat_transform_ from '../geom/flat/transform.js';
import _ol_proj_ from '../proj.js';
import _ol_proj_Units_ from '../proj/Units.js';
import _ol_transform_ from '../transform.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for vector geometries.
 *
 * To get notified of changes to the geometry, register a listener for the
 * generic `change` event on your geometry instance.
 *
 * @constructor
 * @abstract
 * @extends {ol.Object}
 * @api
 */
var _ol_geom_Geometry_ = function() {

  _ol_Object_.call(this);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = _ol_extent_.createEmpty();

  /**
   * @private
   * @type {number}
   */
  this.extentRevision_ = -1;

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

  /**
   * @private
   * @type {ol.Transform}
   */
  this.tmpTransform_ = _ol_transform_.create();

};

inherits(_ol_geom_Geometry_, _ol_Object_);


/**
 * Make a complete copy of the geometry.
 * @abstract
 * @return {!ol.geom.Geometry} Clone.
 */
_ol_geom_Geometry_.prototype.clone = function() {};


/**
 * @abstract
 * @param {number} x X.
 * @param {number} y Y.
 * @param {ol.Coordinate} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @return {number} Minimum squared distance.
 */
_ol_geom_Geometry_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {};


/**
 * Return the closest point of the geometry to the passed point as
 * {@link ol.Coordinate coordinate}.
 * @param {ol.Coordinate} point Point.
 * @param {ol.Coordinate=} opt_closestPoint Closest point.
 * @return {ol.Coordinate} Closest point.
 * @api
 */
_ol_geom_Geometry_.prototype.getClosestPoint = function(point, opt_closestPoint) {
  var closestPoint = opt_closestPoint ? opt_closestPoint : [NaN, NaN];
  this.closestPointXY(point[0], point[1], closestPoint, Infinity);
  return closestPoint;
};


/**
 * Returns true if this geometry includes the specified coordinate. If the
 * coordinate is on the boundary of the geometry, returns false.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains coordinate.
 * @api
 */
_ol_geom_Geometry_.prototype.intersectsCoordinate = function(coordinate) {
  return this.containsXY(coordinate[0], coordinate[1]);
};


/**
 * @abstract
 * @param {ol.Extent} extent Extent.
 * @protected
 * @return {ol.Extent} extent Extent.
 */
_ol_geom_Geometry_.prototype.computeExtent = function(extent) {};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @return {boolean} Contains (x, y).
 */
_ol_geom_Geometry_.prototype.containsXY = _ol_functions_.FALSE;


/**
 * Get the extent of the geometry.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} extent Extent.
 * @api
 */
_ol_geom_Geometry_.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision_ != this.getRevision()) {
    this.extent_ = this.computeExtent(this.extent_);
    this.extentRevision_ = this.getRevision();
  }
  return _ol_extent_.returnOrUpdate(this.extent_, opt_extent);
};


/**
 * Rotate the geometry around a given coordinate. This modifies the geometry
 * coordinates in place.
 * @abstract
 * @param {number} angle Rotation angle in radians.
 * @param {ol.Coordinate} anchor The rotation center.
 * @api
 */
_ol_geom_Geometry_.prototype.rotate = function(angle, anchor) {};


/**
 * Scale the geometry (with an optional origin).  This modifies the geometry
 * coordinates in place.
 * @abstract
 * @param {number} sx The scaling factor in the x-direction.
 * @param {number=} opt_sy The scaling factor in the y-direction (defaults to
 *     sx).
 * @param {ol.Coordinate=} opt_anchor The scale origin (defaults to the center
 *     of the geometry extent).
 * @api
 */
_ol_geom_Geometry_.prototype.scale = function(sx, opt_sy, opt_anchor) {};


/**
 * Create a simplified version of this geometry.  For linestrings, this uses
 * the the {@link
 * https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
 * Douglas Peucker} algorithm.  For polygons, a quantization-based
 * simplification is used to preserve topology.
 * @function
 * @param {number} tolerance The tolerance distance for simplification.
 * @return {ol.geom.Geometry} A new, simplified version of the original
 *     geometry.
 * @api
 */
_ol_geom_Geometry_.prototype.simplify = function(tolerance) {
  return this.getSimplifiedGeometry(tolerance * tolerance);
};


/**
 * Create a simplified version of this geometry using the Douglas Peucker
 * algorithm.
 * @see https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
 * @abstract
 * @param {number} squaredTolerance Squared tolerance.
 * @return {ol.geom.Geometry} Simplified geometry.
 */
_ol_geom_Geometry_.prototype.getSimplifiedGeometry = function(squaredTolerance) {};


/**
 * Get the type of this geometry.
 * @abstract
 * @return {ol.geom.GeometryType} Geometry type.
 */
_ol_geom_Geometry_.prototype.getType = function() {};


/**
 * Apply a transform function to each coordinate of the geometry.
 * The geometry is modified in place.
 * If you do not want the geometry modified in place, first `clone()` it and
 * then use this function on the clone.
 * @abstract
 * @param {ol.TransformFunction} transformFn Transform.
 */
_ol_geom_Geometry_.prototype.applyTransform = function(transformFn) {};


/**
 * Test if the geometry and the passed extent intersect.
 * @abstract
 * @param {ol.Extent} extent Extent.
 * @return {boolean} `true` if the geometry and the extent intersect.
 */
_ol_geom_Geometry_.prototype.intersectsExtent = function(extent) {};


/**
 * Translate the geometry.  This modifies the geometry coordinates in place.  If
 * instead you want a new geometry, first `clone()` this geometry.
 * @abstract
 * @param {number} deltaX Delta X.
 * @param {number} deltaY Delta Y.
 */
_ol_geom_Geometry_.prototype.translate = function(deltaX, deltaY) {};


/**
 * Transform each coordinate of the geometry from one coordinate reference
 * system to another. The geometry is modified in place.
 * For example, a line will be transformed to a line and a circle to a circle.
 * If you do not want the geometry modified in place, first `clone()` it and
 * then use this function on the clone.
 *
 * @param {ol.ProjectionLike} source The current projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @param {ol.ProjectionLike} destination The desired projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @return {ol.geom.Geometry} This geometry.  Note that original geometry is
 *     modified in place.
 * @api
 */
_ol_geom_Geometry_.prototype.transform = function(source, destination) {
  var tmpTransform = this.tmpTransform_;
  source = _ol_proj_.get(source);
  var transformFn = source.getUnits() == _ol_proj_Units_.TILE_PIXELS ?
    function(inCoordinates, outCoordinates, stride) {
      var pixelExtent = source.getExtent();
      var projectedExtent = source.getWorldExtent();
      var scale = _ol_extent_.getHeight(projectedExtent) / _ol_extent_.getHeight(pixelExtent);
      _ol_transform_.compose(tmpTransform,
          projectedExtent[0], projectedExtent[3],
          scale, -scale, 0,
          0, 0);
      _ol_geom_flat_transform_.transform2D(inCoordinates, 0, inCoordinates.length, stride,
          tmpTransform, outCoordinates);
      return _ol_proj_.getTransform(source, destination)(inCoordinates, outCoordinates, stride);
    } :
    _ol_proj_.getTransform(source, destination);
  this.applyTransform(transformFn);
  return this;
};
export default _ol_geom_Geometry_;
