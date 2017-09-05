import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate';
import _ol_math_ from '../math';

/**
 * @classdesc
 * Multi-point geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_MultiPoint_ = function(coordinates, opt_layout) {
  _ol_geom_SimpleGeometry_.call(this);
  this.setCoordinates(coordinates, opt_layout);
};

_ol_.inherits(_ol_geom_MultiPoint_, _ol_geom_SimpleGeometry_);


/**
 * Append the passed point to this multipoint.
 * @param {ol.geom.Point} point Point.
 * @api
 */
_ol_geom_MultiPoint_.prototype.appendPoint = function(point) {
  if (!this.flatCoordinates) {
    this.flatCoordinates = point.getFlatCoordinates().slice();
  } else {
    _ol_array_.extend(this.flatCoordinates, point.getFlatCoordinates());
  }
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.MultiPoint} Clone.
 * @override
 * @api
 */
_ol_geom_MultiPoint_.prototype.clone = function() {
  var multiPoint = new _ol_geom_MultiPoint_(null);
  multiPoint.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return multiPoint;
};


/**
 * @inheritDoc
 */
_ol_geom_MultiPoint_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      _ol_extent_.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  var flatCoordinates = this.flatCoordinates;
  var stride = this.stride;
  var i, ii, j;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    var squaredDistance = _ol_math_.squaredDistance(
        x, y, flatCoordinates[i], flatCoordinates[i + 1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (j = 0; j < stride; ++j) {
        closestPoint[j] = flatCoordinates[i + j];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
};


/**
 * Return the coordinates of the multipoint.
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @override
 * @api
 */
_ol_geom_MultiPoint_.prototype.getCoordinates = function() {
  return _ol_geom_flat_inflate_.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the point at the specified index.
 * @param {number} index Index.
 * @return {ol.geom.Point} Point.
 * @api
 */
_ol_geom_MultiPoint_.prototype.getPoint = function(index) {
  var n = !this.flatCoordinates ?
    0 : this.flatCoordinates.length / this.stride;
  if (index < 0 || n <= index) {
    return null;
  }
  var point = new _ol_geom_Point_(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index * this.stride, (index + 1) * this.stride));
  return point;
};


/**
 * Return the points of this multipoint.
 * @return {Array.<ol.geom.Point>} Points.
 * @api
 */
_ol_geom_MultiPoint_.prototype.getPoints = function() {
  var flatCoordinates = this.flatCoordinates;
  var layout = this.layout;
  var stride = this.stride;
  /** @type {Array.<ol.geom.Point>} */
  var points = [];
  var i, ii;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    var point = new _ol_geom_Point_(null);
    point.setFlatCoordinates(layout, flatCoordinates.slice(i, i + stride));
    points.push(point);
  }
  return points;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_MultiPoint_.prototype.getType = function() {
  return _ol_geom_GeometryType_.MULTI_POINT;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_MultiPoint_.prototype.intersectsExtent = function(extent) {
  var flatCoordinates = this.flatCoordinates;
  var stride = this.stride;
  var i, ii, x, y;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    x = flatCoordinates[i];
    y = flatCoordinates[i + 1];
    if (_ol_extent_.containsXY(extent, x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * Set the coordinates of the multipoint.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
_ol_geom_MultiPoint_.prototype.setCoordinates = function(coordinates, opt_layout) {
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
_ol_geom_MultiPoint_.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default _ol_geom_MultiPoint_;
