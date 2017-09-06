import _ol_ from '../index';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_area_ from '../geom/flat/area';
import _ol_geom_flat_closest_ from '../geom/flat/closest';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate';
import _ol_geom_flat_simplify_ from '../geom/flat/simplify';

/**
 * @classdesc
 * Linear ring geometry. Only used as part of polygon; cannot be rendered
 * on its own.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_LinearRing_ = function(coordinates, opt_layout) {

  _ol_geom_SimpleGeometry_.call(this);

  /**
   * @private
   * @type {number}
   */
  this.maxDelta_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.maxDeltaRevision_ = -1;

  this.setCoordinates(coordinates, opt_layout);

};

_ol_.inherits(_ol_geom_LinearRing_, _ol_geom_SimpleGeometry_);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.LinearRing} Clone.
 * @override
 * @api
 */
_ol_geom_LinearRing_.prototype.clone = function() {
  var linearRing = new _ol_geom_LinearRing_(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return linearRing;
};


/**
 * @inheritDoc
 */
_ol_geom_LinearRing_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      _ol_extent_.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(_ol_geom_flat_closest_.getMaxSquaredDelta(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return _ol_geom_flat_closest_.getClosestPoint(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * Return the area of the linear ring on projected plane.
 * @return {number} Area (on projected plane).
 * @api
 */
_ol_geom_LinearRing_.prototype.getArea = function() {
  return _ol_geom_flat_area_.linearRing(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the coordinates of the linear ring.
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @override
 * @api
 */
_ol_geom_LinearRing_.prototype.getCoordinates = function() {
  return _ol_geom_flat_inflate_.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
_ol_geom_LinearRing_.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = _ol_geom_flat_simplify_.douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
  var simplifiedLinearRing = new _ol_geom_LinearRing_(null);
  simplifiedLinearRing.setFlatCoordinates(
      _ol_geom_GeometryLayout_.XY, simplifiedFlatCoordinates);
  return simplifiedLinearRing;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_LinearRing_.prototype.getType = function() {
  return _ol_geom_GeometryType_.LINEAR_RING;
};


/**
 * @inheritDoc
 */
_ol_geom_LinearRing_.prototype.intersectsExtent = function(extent) {};


/**
 * Set the coordinates of the linear ring.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
_ol_geom_LinearRing_.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = _ol_geom_flat_deflate_.coordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
_ol_geom_LinearRing_.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default _ol_geom_LinearRing_;
