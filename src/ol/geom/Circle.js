/**
 * @module ol/geom/Circle
 */
import {inherits} from '../util.js';
import {createOrUpdate, forEachCorner, intersects} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {deflateCoordinate} from '../geom/flat/deflate.js';

/**
 * @classdesc
 * Circle geometry.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number=} opt_radius Radius.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const Circle = function(center, opt_radius, opt_layout) {
  SimpleGeometry.call(this);
  const radius = opt_radius ? opt_radius : 0;
  this.setCenterAndRadius(center, radius, opt_layout);
};

inherits(Circle, SimpleGeometry);


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/Circle} Clone.
 * @override
 * @api
 */
Circle.prototype.clone = function() {
  const circle = new Circle(null);
  circle.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return circle;
};


/**
 * @inheritDoc
 */
Circle.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  const flatCoordinates = this.flatCoordinates;
  const dx = x - flatCoordinates[0];
  const dy = y - flatCoordinates[1];
  const squaredDistance = dx * dx + dy * dy;
  if (squaredDistance < minSquaredDistance) {
    if (squaredDistance === 0) {
      for (let i = 0; i < this.stride; ++i) {
        closestPoint[i] = flatCoordinates[i];
      }
    } else {
      const delta = this.getRadius() / Math.sqrt(squaredDistance);
      closestPoint[0] = flatCoordinates[0] + delta * dx;
      closestPoint[1] = flatCoordinates[1] + delta * dy;
      for (let i = 2; i < this.stride; ++i) {
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
Circle.prototype.containsXY = function(x, y) {
  const flatCoordinates = this.flatCoordinates;
  const dx = x - flatCoordinates[0];
  const dy = y - flatCoordinates[1];
  return dx * dx + dy * dy <= this.getRadiusSquared_();
};


/**
 * Return the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
 * @return {module:ol/coordinate~Coordinate} Center.
 * @api
 */
Circle.prototype.getCenter = function() {
  return this.flatCoordinates.slice(0, this.stride);
};


/**
 * @inheritDoc
 */
Circle.prototype.computeExtent = function(extent) {
  const flatCoordinates = this.flatCoordinates;
  const radius = flatCoordinates[this.stride] - flatCoordinates[0];
  return createOrUpdate(
    flatCoordinates[0] - radius, flatCoordinates[1] - radius,
    flatCoordinates[0] + radius, flatCoordinates[1] + radius,
    extent);
};


/**
 * Return the radius of the circle.
 * @return {number} Radius.
 * @api
 */
Circle.prototype.getRadius = function() {
  return Math.sqrt(this.getRadiusSquared_());
};


/**
 * @private
 * @return {number} Radius squared.
 */
Circle.prototype.getRadiusSquared_ = function() {
  const dx = this.flatCoordinates[this.stride] - this.flatCoordinates[0];
  const dy = this.flatCoordinates[this.stride + 1] - this.flatCoordinates[1];
  return dx * dx + dy * dy;
};


/**
 * @inheritDoc
 * @api
 */
Circle.prototype.getType = function() {
  return GeometryType.CIRCLE;
};


/**
 * @inheritDoc
 * @api
 */
Circle.prototype.intersectsExtent = function(extent) {
  const circleExtent = this.getExtent();
  if (intersects(extent, circleExtent)) {
    const center = this.getCenter();

    if (extent[0] <= center[0] && extent[2] >= center[0]) {
      return true;
    }
    if (extent[1] <= center[1] && extent[3] >= center[1]) {
      return true;
    }

    return forEachCorner(extent, this.intersectsCoordinate, this);
  }
  return false;

};


/**
 * Set the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @api
 */
Circle.prototype.setCenter = function(center) {
  const stride = this.stride;
  const radius = this.flatCoordinates[stride] - this.flatCoordinates[0];
  const flatCoordinates = center.slice();
  flatCoordinates[stride] = flatCoordinates[0] + radius;
  for (let i = 1; i < stride; ++i) {
    flatCoordinates[stride + i] = center[i];
  }
  this.setFlatCoordinates(this.layout, flatCoordinates);
};


/**
 * Set the center (as {@link module:ol/coordinate~Coordinate coordinate}) and the radius (as
 * number) of the circle.
 * @param {module:ol/coordinate~Coordinate} center Center.
 * @param {number} radius Radius.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
Circle.prototype.setCenterAndRadius = function(center, radius, opt_layout) {
  if (!center) {
    this.setFlatCoordinates(GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, center, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    /** @type {Array.<number>} */
    const flatCoordinates = this.flatCoordinates;
    let offset = deflateCoordinate(
      flatCoordinates, 0, center, this.stride);
    flatCoordinates[offset++] = flatCoordinates[0] + radius;
    for (let i = 1, ii = this.stride; i < ii; ++i) {
      flatCoordinates[offset++] = flatCoordinates[i];
    }
    flatCoordinates.length = offset;
    this.changed();
  }
};


/**
 * @inheritDoc
 */
Circle.prototype.getCoordinates = function() {};


/**
 * @inheritDoc
 */
Circle.prototype.setCoordinates = function(coordinates, opt_layout) {};


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
Circle.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};


/**
 * Set the radius of the circle. The radius is in the units of the projection.
 * @param {number} radius Radius.
 * @api
 */
Circle.prototype.setRadius = function(radius) {
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
 * @param {module:ol/proj~ProjectionLike} source The current projection.  Can be a
 *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
 * @param {module:ol/proj~ProjectionLike} destination The desired projection.  Can be a
 *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
 * @return {module:ol/geom/Circle} This geometry.  Note that original geometry is
 *     modified in place.
 * @function
 * @api
 */
Circle.prototype.transform;
export default Circle;
