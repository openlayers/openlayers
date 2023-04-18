/**
 * @module ol/geom/Circle
 */
import SimpleGeometry from './SimpleGeometry.js';
import {createOrUpdate, forEachCorner, intersects} from '../extent.js';
import {deflateCoordinate} from './flat/deflate.js';
import {rotate, translate} from './flat/transform.js';

/**
 * @classdesc
 * Circle geometry.
 *
 * @api
 */
class Circle extends SimpleGeometry {
  /**
   * @param {!import("../coordinate.js").Coordinate} center Center.
   *     For internal use, flat coordinates in combination with `layout` and no
   *     `radius` are also accepted.
   * @param {number} [radius] Radius.
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   */
  constructor(center, radius, layout) {
    super();
    if (layout !== undefined && radius === undefined) {
      this.setFlatCoordinates(layout, center);
    } else {
      radius = radius ? radius : 0;
      this.setCenterAndRadius(center, radius, layout);
    }
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!Circle} Clone.
   * @api
   */
  clone() {
    const circle = new Circle(
      this.flatCoordinates.slice(),
      undefined,
      this.layout
    );
    circle.applyProperties(this);
    return circle;
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
   * @param {number} minSquaredDistance Minimum squared distance.
   * @return {number} Minimum squared distance.
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
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
    }
    return minSquaredDistance;
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @return {boolean} Contains (x, y).
   */
  containsXY(x, y) {
    const flatCoordinates = this.flatCoordinates;
    const dx = x - flatCoordinates[0];
    const dy = y - flatCoordinates[1];
    return dx * dx + dy * dy <= this.getRadiusSquared_();
  }

  /**
   * Return the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
   * @return {import("../coordinate.js").Coordinate} Center.
   * @api
   */
  getCenter() {
    return this.flatCoordinates.slice(0, this.stride);
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    const flatCoordinates = this.flatCoordinates;
    const radius = this.getRadius();
    return createOrUpdate(
      flatCoordinates[0] - radius,
      flatCoordinates[1] - radius,
      flatCoordinates[0] + radius,
      flatCoordinates[1] + radius,
      extent
    );
  }

  /**
   * Return the radius of the circle.
   * @return {number} Radius.
   * @api
   */
  getRadius() {
    return Math.sqrt(this.getRadiusSquared_());
  }

  /**
   * @private
   * @return {number} Radius squared.
   */
  getRadiusSquared_() {
    const dx = this.flatCoordinates[this.stride] - this.flatCoordinates[0];
    const dy = this.flatCoordinates[this.stride + 1] - this.flatCoordinates[1];
    return dx * dx + dy * dy;
  }

  /**
   * Get the type of this geometry.
   * @return {import("./Geometry.js").Type} Geometry type.
   * @api
   */
  getType() {
    return 'Circle';
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   */
  intersectsExtent(extent) {
    const circleExtent = this.getExtent();
    if (intersects(extent, circleExtent)) {
      const center = this.getCenter();

      if (extent[0] <= center[0] && extent[2] >= center[0]) {
        return true;
      }
      if (extent[1] <= center[1] && extent[3] >= center[1]) {
        return true;
      }

      return forEachCorner(extent, this.intersectsCoordinate.bind(this));
    }
    return false;
  }

  /**
   * Set the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
   * @param {import("../coordinate.js").Coordinate} center Center.
   * @api
   */
  setCenter(center) {
    const stride = this.stride;
    const radiusX = this.flatCoordinates[stride] - this.flatCoordinates[0];
    const radiusY = this.flatCoordinates[stride + 1] - this.flatCoordinates[1];
    const flatCoordinates = center.slice();
    flatCoordinates[stride] = flatCoordinates[0] + radiusX;
    flatCoordinates[stride + 1] = flatCoordinates[1] + radiusY;
    for (let i = 2; i < stride; ++i) {
      flatCoordinates[stride + i] = center[i];
    }
    this.setFlatCoordinates(this.layout, flatCoordinates);
    this.changed();
  }

  /**
   * Set the center (as {@link module:ol/coordinate~Coordinate coordinate}) and the radius (as
   * number) of the circle.
   * @param {!import("../coordinate.js").Coordinate} center Center.
   * @param {number} radius Radius.
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   * @api
   */
  setCenterAndRadius(center, radius, layout) {
    this.setLayout(layout, center, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    /** @type {Array<number>} */
    const flatCoordinates = this.flatCoordinates;
    let offset = deflateCoordinate(flatCoordinates, 0, center, this.stride);
    flatCoordinates[offset++] = flatCoordinates[0] + radius;
    for (let i = 1, ii = this.stride; i < ii; ++i) {
      flatCoordinates[offset++] = flatCoordinates[i];
    }
    flatCoordinates.length = offset;
    this.changed();
  }

  getCoordinates() {
    return null;
  }

  setCoordinates(coordinates, layout) {}

  /**
   * Set the radius of the circle. The radius is in the units of the projection.
   * @param {number} radius Radius.
   * @api
   */
  setRadius(radius) {
    const stride = this.stride;
    this.flatCoordinates[stride] = this.flatCoordinates[0] + radius;
    for (let i = 1; i < stride; ++i) {
      this.flatCoordinates[stride + i] = this.flatCoordinates[i];
    }
    this.changed();
  }

  /**
   * Rotate the geometry around a given coordinate. This modifies the geometry
   * coordinates in place.
   * @param {number} angle Rotation angle in counter-clockwise radians.
   * @param {import("../coordinate.js").Coordinate} anchor The rotation center.
   * @api
   */
  rotate(angle, anchor) {
    const center = this.getCenter();
    const stride = this.getStride();
    this.setCenter(
      rotate(center, 0, center.length, stride, angle, anchor, center)
    );
    this.changed();
  }

  /**
   * Translate the geometry.  This modifies the geometry coordinates in place.  If
   * instead you want a new geometry, first `clone()` this geometry.
   * @param {number} deltaX Delta X.
   * @param {number} deltaY Delta Y.
   * @api
   */
  translate(deltaX, deltaY) {
    const center = this.getCenter();
    const stride = this.getStride();
    this.setCenter(
      translate(center, 0, center.length, stride, deltaX, deltaY, center)
    );
    this.changed();
  }

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
   * @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @return {Circle} This geometry.  Note that original geometry is
   *     modified in place.
   * @function
   * @api
   */
  transform(source, destination) {
    return /** @type {Circle} */ (super.transform(source, destination));
  }

  /**
   * Transform the circle from one coordinate reference system to another.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first clone() it and
   * then use this function on the clone.
   *
   * Internally the resulting geometry is represented by two points: the center of
   * the circle `[cx, cy]`, and the point to the right of the circle
   * `[cx + r, cy]`. This function is not reversible but the `transform` method can be
   * used to return a circle in the original projection with center and radius similar
   * to the original values although the second point from which the radius is calculated
   * may be different.  This is useful for interactions which work internally in view
   * projection and return results in a user projection.
   *
   * @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
   *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
   * @return {Circle} This geometry.  Note that original geometry is
   *     modified in place.
   */
  transformToNormalCircle(source, destination) {
    const TARGET_TOLERANCE = 1e-11;
    const MAX_ATTEMPTS = 6;

    const circle = this.clone();
    const radius = circle.getRadius();
    // adjust radius to fit [cx + r, cy] when transformed
    for (let i = 0; i < MAX_ATTEMPTS; ++i) {
      const circleGeometry = circle.clone();
      circleGeometry.transform(source, destination);
      circleGeometry.setRadius(circleGeometry.getRadius());
      const currentRadius = circleGeometry
        .transform(destination, source)
        .getRadius();
      if (
        currentRadius === radius ||
        Math.abs(currentRadius - radius) / radius < TARGET_TOLERANCE
      ) {
        break;
      }
      if (currentRadius > 0) {
        circle.scale(radius / currentRadius, undefined, circle.getCenter());
      }
    }
    circle.transform(source, destination);
    this.setCenterAndRadius(
      circle.getCenter(),
      circle.getRadius(),
      this.layout
    );
    return this;
  }
}
export default Circle;
