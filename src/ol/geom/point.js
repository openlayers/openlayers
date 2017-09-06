import _ol_ from '../index';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';
import _ol_math_ from '../math';

/**
 * @classdesc
 * Point geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.Coordinate} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_Point_ = function(coordinates, opt_layout) {
  _ol_geom_SimpleGeometry_.call(this);
  this.setCoordinates(coordinates, opt_layout);
};

_ol_.inherits(_ol_geom_Point_, _ol_geom_SimpleGeometry_);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Point} Clone.
 * @override
 * @api
 */
_ol_geom_Point_.prototype.clone = function() {
  var point = new _ol_geom_Point_(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return point;
};


/**
 * @inheritDoc
 */
_ol_geom_Point_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  var flatCoordinates = this.flatCoordinates;
  var squaredDistance = _ol_math_.squaredDistance(
      x, y, flatCoordinates[0], flatCoordinates[1]);
  if (squaredDistance < minSquaredDistance) {
    var stride = this.stride;
    var i;
    for (i = 0; i < stride; ++i) {
      closestPoint[i] = flatCoordinates[i];
    }
    closestPoint.length = stride;
    return squaredDistance;
  } else {
    return minSquaredDistance;
  }
};


/**
 * Return the coordinate of the point.
 * @return {ol.Coordinate} Coordinates.
 * @override
 * @api
 */
_ol_geom_Point_.prototype.getCoordinates = function() {
  return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
};


/**
 * @inheritDoc
 */
_ol_geom_Point_.prototype.computeExtent = function(extent) {
  return _ol_extent_.createOrUpdateFromCoordinate(this.flatCoordinates, extent);
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Point_.prototype.getType = function() {
  return _ol_geom_GeometryType_.POINT;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Point_.prototype.intersectsExtent = function(extent) {
  return _ol_extent_.containsXY(extent,
      this.flatCoordinates[0], this.flatCoordinates[1]);
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Point_.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = _ol_geom_flat_deflate_.coordinate(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
_ol_geom_Point_.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default _ol_geom_Point_;
