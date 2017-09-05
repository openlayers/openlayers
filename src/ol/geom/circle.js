import _ol_ from '../index';
import _ol_extent_ from '../extent';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate';

/**
 * @classdesc
 * Circle geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.Coordinate} center Center.
 * @param {number=} opt_radius Radius.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var _ol_geom_Circle_ = function(center, opt_radius, opt_layout) {
  _ol_geom_SimpleGeometry_.call(this);
  var radius = opt_radius ? opt_radius : 0;
  this.setCenterAndRadius(center, radius, opt_layout);
};

_ol_.inherits(_ol_geom_Circle_, _ol_geom_SimpleGeometry_);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Circle} Clone.
 * @override
 * @api
 */
_ol_geom_Circle_.prototype.clone = function() {
  var circle = new _ol_geom_Circle_(null);
  circle.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return circle;
};


/**
 * @inheritDoc
 */
_ol_geom_Circle_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  var flatCoordinates = this.flatCoordinates;
  var dx = x - flatCoordinates[0];
  var dy = y - flatCoordinates[1];
  var squaredDistance = dx * dx + dy * dy;
  if (squaredDistance < minSquaredDistance) {
    var i;
    if (squaredDistance === 0) {
      for (i = 0; i < this.stride; ++i) {
        closestPoint[i] = flatCoordinates[i];
      }
    } else {
      var delta = this.getRadius() / Math.sqrt(squaredDistance);
      closestPoint[0] = flatCoordinates[0] + delta * dx;
      closestPoint[1] = flatCoordinates[1] + delta * dy;
      for (i = 2; i < this.stride; ++i) {
        closestPoint[i] = flatCoordinates[i];
      }
    }
    closestPoint.length = this.stride;
    return squaredDistance;
  } else {
    return minSquaredDistance;
  }
};


/**
 * @inheritDoc
 */
_ol_geom_Circle_.prototype.containsXY = function(x, y) {
  var flatCoordinates = this.flatCoordinates;
  var dx = x - flatCoordinates[0];
  var dy = y - flatCoordinates[1];
  return dx * dx + dy * dy <= this.getRadiusSquared_();
};


/**
 * Return the center of the circle as {@link ol.Coordinate coordinate}.
 * @return {ol.Coordinate} Center.
 * @api
 */
_ol_geom_Circle_.prototype.getCenter = function() {
  return this.flatCoordinates.slice(0, this.stride);
};


/**
 * @inheritDoc
 */
_ol_geom_Circle_.prototype.computeExtent = function(extent) {
  var flatCoordinates = this.flatCoordinates;
  var radius = flatCoordinates[this.stride] - flatCoordinates[0];
  return _ol_extent_.createOrUpdate(
      flatCoordinates[0] - radius, flatCoordinates[1] - radius,
      flatCoordinates[0] + radius, flatCoordinates[1] + radius,
      extent);
};


/**
 * Return the radius of the circle.
 * @return {number} Radius.
 * @api
 */
_ol_geom_Circle_.prototype.getRadius = function() {
  return Math.sqrt(this.getRadiusSquared_());
};


/**
 * @private
 * @return {number} Radius squared.
 */
_ol_geom_Circle_.prototype.getRadiusSquared_ = function() {
  var dx = this.flatCoordinates[this.stride] - this.flatCoordinates[0];
  var dy = this.flatCoordinates[this.stride + 1] - this.flatCoordinates[1];
  return dx * dx + dy * dy;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Circle_.prototype.getType = function() {
  return _ol_geom_GeometryType_.CIRCLE;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_Circle_.prototype.intersectsExtent = function(extent) {
  var circleExtent = this.getExtent();
  if (_ol_extent_.intersects(extent, circleExtent)) {
    var center = this.getCenter();

    if (extent[0] <= center[0] && extent[2] >= center[0]) {
      return true;
    }
    if (extent[1] <= center[1] && extent[3] >= center[1]) {
      return true;
    }

    return _ol_extent_.forEachCorner(extent, this.intersectsCoordinate, this);
  }
  return false;

};


/**
 * Set the center of the circle as {@link ol.Coordinate coordinate}.
 * @param {ol.Coordinate} center Center.
 * @api
 */
_ol_geom_Circle_.prototype.setCenter = function(center) {
  var stride = this.stride;
  var radius = this.flatCoordinates[stride] - this.flatCoordinates[0];
  var flatCoordinates = center.slice();
  flatCoordinates[stride] = flatCoordinates[0] + radius;
  var i;
  for (i = 1; i < stride; ++i) {
    flatCoordinates[stride + i] = center[i];
  }
  this.setFlatCoordinates(this.layout, flatCoordinates);
};


/**
 * Set the center (as {@link ol.Coordinate coordinate}) and the radius (as
 * number) of the circle.
 * @param {ol.Coordinate} center Center.
 * @param {number} radius Radius.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
_ol_geom_Circle_.prototype.setCenterAndRadius = function(center, radius, opt_layout) {
  if (!center) {
    this.setFlatCoordinates(_ol_geom_GeometryLayout_.XY, null);
  } else {
    this.setLayout(opt_layout, center, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    /** @type {Array.<number>} */
    var flatCoordinates = this.flatCoordinates;
    var offset = _ol_geom_flat_deflate_.coordinate(
        flatCoordinates, 0, center, this.stride);
    flatCoordinates[offset++] = flatCoordinates[0] + radius;
    var i, ii;
    for (i = 1, ii = this.stride; i < ii; ++i) {
      flatCoordinates[offset++] = flatCoordinates[i];
    }
    flatCoordinates.length = offset;
    this.changed();
  }
};


/**
 * @inheritDoc
 */
_ol_geom_Circle_.prototype.getCoordinates = function() {};


/**
 * @inheritDoc
 */
_ol_geom_Circle_.prototype.setCoordinates = function(coordinates, opt_layout) {};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
_ol_geom_Circle_.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};


/**
 * Set the radius of the circle. The radius is in the units of the projection.
 * @param {number} radius Radius.
 * @api
 */
_ol_geom_Circle_.prototype.setRadius = function(radius) {
  this.flatCoordinates[this.stride] = this.flatCoordinates[0] + radius;
  this.changed();
};


/**
 * Transform each coordinate of the circle from one coordinate reference system
 * to another. The geometry is modified in place.
 * If you do not want the geometry modified in place, first clone() it and
 * then use this function on the clone.
 *
 * Internally a circle is currently represented by two points: the center of
 * the circle `[cx, cy]`, and the point to the right of the circle
 * `[cx + r, cy]`. This `transform` function just transforms these two points.
 * So the resulting geometry is also a circle, and that circle does not
 * correspond to the shape that would be obtained by transforming every point
 * of the original circle.
 *
 * @param {ol.ProjectionLike} source The current projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @param {ol.ProjectionLike} destination The desired projection.  Can be a
 *     string identifier or a {@link ol.proj.Projection} object.
 * @return {ol.geom.Circle} This geometry.  Note that original geometry is
 *     modified in place.
 * @function
 * @api
 */
_ol_geom_Circle_.prototype.transform;
export default _ol_geom_Circle_;
