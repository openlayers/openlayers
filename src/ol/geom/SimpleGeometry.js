/**
 * @module ol/geom/SimpleGeometry
 */
import {inherits} from '../util.js';
import {FALSE} from '../functions.js';
import {createOrUpdateFromFlatCoordinates, getCenter} from '../extent.js';
import Geometry from '../geom/Geometry.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import {rotate, scale, translate, transform2D} from '../geom/flat/transform.js';
import {clear} from '../obj.js';

/**
 * @classdesc
 * Abstract base class; only used for creating subclasses; do not instantiate
 * in apps, as cannot be rendered.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/geom/Geometry}
 * @api
 */
const SimpleGeometry = function() {

  Geometry.call(this);

  /**
   * @protected
   * @type {module:ol/geom/GeometryLayout}
   */
  this.layout = GeometryLayout.XY;

  /**
   * @protected
   * @type {number}
   */
  this.stride = 2;

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.flatCoordinates = null;

};

inherits(SimpleGeometry, Geometry);


/**
 * @param {number} stride Stride.
 * @return {module:ol/geom/GeometryLayout} layout Layout.
 */
function getLayoutForStride(stride) {
  let layout;
  if (stride == 2) {
    layout = GeometryLayout.XY;
  } else if (stride == 3) {
    layout = GeometryLayout.XYZ;
  } else if (stride == 4) {
    layout = GeometryLayout.XYZM;
  }
  return (
    /** @type {module:ol/geom/GeometryLayout} */ (layout)
  );
}


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @return {number} Stride.
 */
export function getStrideForLayout(layout) {
  let stride;
  if (layout == GeometryLayout.XY) {
    stride = 2;
  } else if (layout == GeometryLayout.XYZ || layout == GeometryLayout.XYM) {
    stride = 3;
  } else if (layout == GeometryLayout.XYZM) {
    stride = 4;
  }
  return /** @type {number} */ (stride);
}


/**
 * @inheritDoc
 */
SimpleGeometry.prototype.containsXY = FALSE;


/**
 * @inheritDoc
 */
SimpleGeometry.prototype.computeExtent = function(extent) {
  return createOrUpdateFromFlatCoordinates(this.flatCoordinates,
    0, this.flatCoordinates.length, this.stride, extent);
};


/**
 * @abstract
 * @return {Array} Coordinates.
 */
SimpleGeometry.prototype.getCoordinates = function() {};


/**
 * Return the first coordinate of the geometry.
 * @return {module:ol/coordinate~Coordinate} First coordinate.
 * @api
 */
SimpleGeometry.prototype.getFirstCoordinate = function() {
  return this.flatCoordinates.slice(0, this.stride);
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
SimpleGeometry.prototype.getFlatCoordinates = function() {
  return this.flatCoordinates;
};


/**
 * Return the last coordinate of the geometry.
 * @return {module:ol/coordinate~Coordinate} Last point.
 * @api
 */
SimpleGeometry.prototype.getLastCoordinate = function() {
  return this.flatCoordinates.slice(this.flatCoordinates.length - this.stride);
};


/**
 * Return the {@link module:ol/geom/GeometryLayout~GeometryLayout layout} of the geometry.
 * @return {module:ol/geom/GeometryLayout} Layout.
 * @api
 */
SimpleGeometry.prototype.getLayout = function() {
  return this.layout;
};


/**
 * @inheritDoc
 */
SimpleGeometry.prototype.getSimplifiedGeometry = function(squaredTolerance) {
  if (this.simplifiedGeometryRevision != this.getRevision()) {
    clear(this.simplifiedGeometryCache);
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;
    this.simplifiedGeometryRevision = this.getRevision();
  }
  // If squaredTolerance is negative or if we know that simplification will not
  // have any effect then just return this.
  if (squaredTolerance < 0 ||
      (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
       squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance)) {
    return this;
  }
  const key = squaredTolerance.toString();
  if (this.simplifiedGeometryCache.hasOwnProperty(key)) {
    return this.simplifiedGeometryCache[key];
  } else {
    const simplifiedGeometry =
        this.getSimplifiedGeometryInternal(squaredTolerance);
    const simplifiedFlatCoordinates = simplifiedGeometry.getFlatCoordinates();
    if (simplifiedFlatCoordinates.length < this.flatCoordinates.length) {
      this.simplifiedGeometryCache[key] = simplifiedGeometry;
      return simplifiedGeometry;
    } else {
      // Simplification did not actually remove any coordinates.  We now know
      // that any calls to getSimplifiedGeometry with a squaredTolerance less
      // than or equal to the current squaredTolerance will also not have any
      // effect.  This allows us to short circuit simplification (saving CPU
      // cycles) and prevents the cache of simplified geometries from filling
      // up with useless identical copies of this geometry (saving memory).
      this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
      return this;
    }
  }
};


/**
 * @param {number} squaredTolerance Squared tolerance.
 * @return {module:ol/geom/SimpleGeometry} Simplified geometry.
 * @protected
 */
SimpleGeometry.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  return this;
};


/**
 * @return {number} Stride.
 */
SimpleGeometry.prototype.getStride = function() {
  return this.stride;
};


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @protected
 */
SimpleGeometry.prototype.setFlatCoordinatesInternal = function(layout, flatCoordinates) {
  this.stride = getStrideForLayout(layout);
  this.layout = layout;
  this.flatCoordinates = flatCoordinates;
};


/**
 * @abstract
 * @param {Array} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 */
SimpleGeometry.prototype.setCoordinates = function(coordinates, opt_layout) {};


/**
 * @param {module:ol/geom/GeometryLayout|undefined} layout Layout.
 * @param {Array} coordinates Coordinates.
 * @param {number} nesting Nesting.
 * @protected
 */
SimpleGeometry.prototype.setLayout = function(layout, coordinates, nesting) {
  /** @type {number} */
  let stride;
  if (layout) {
    stride = getStrideForLayout(layout);
  } else {
    for (let i = 0; i < nesting; ++i) {
      if (coordinates.length === 0) {
        this.layout = GeometryLayout.XY;
        this.stride = 2;
        return;
      } else {
        coordinates = /** @type {Array} */ (coordinates[0]);
      }
    }
    stride = coordinates.length;
    layout = getLayoutForStride(stride);
  }
  this.layout = layout;
  this.stride = stride;
};


/**
 * @inheritDoc
 * @api
 */
SimpleGeometry.prototype.applyTransform = function(transformFn) {
  if (this.flatCoordinates) {
    transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
    this.changed();
  }
};


/**
 * @inheritDoc
 * @api
 */
SimpleGeometry.prototype.rotate = function(angle, anchor) {
  const flatCoordinates = this.getFlatCoordinates();
  if (flatCoordinates) {
    const stride = this.getStride();
    rotate(
      flatCoordinates, 0, flatCoordinates.length,
      stride, angle, anchor, flatCoordinates);
    this.changed();
  }
};


/**
 * @inheritDoc
 * @api
 */
SimpleGeometry.prototype.scale = function(sx, opt_sy, opt_anchor) {
  let sy = opt_sy;
  if (sy === undefined) {
    sy = sx;
  }
  let anchor = opt_anchor;
  if (!anchor) {
    anchor = getCenter(this.getExtent());
  }
  const flatCoordinates = this.getFlatCoordinates();
  if (flatCoordinates) {
    const stride = this.getStride();
    scale(
      flatCoordinates, 0, flatCoordinates.length,
      stride, sx, sy, anchor, flatCoordinates);
    this.changed();
  }
};


/**
 * @inheritDoc
 * @api
 */
SimpleGeometry.prototype.translate = function(deltaX, deltaY) {
  const flatCoordinates = this.getFlatCoordinates();
  if (flatCoordinates) {
    const stride = this.getStride();
    translate(
      flatCoordinates, 0, flatCoordinates.length, stride,
      deltaX, deltaY, flatCoordinates);
    this.changed();
  }
};


/**
 * @param {module:ol/geom/SimpleGeometry} simpleGeometry Simple geometry.
 * @param {module:ol/transform~Transform} transform Transform.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Transformed flat coordinates.
 */
export function transformGeom2D(simpleGeometry, transform, opt_dest) {
  const flatCoordinates = simpleGeometry.getFlatCoordinates();
  if (!flatCoordinates) {
    return null;
  } else {
    const stride = simpleGeometry.getStride();
    return transform2D(
      flatCoordinates, 0, flatCoordinates.length, stride,
      transform, opt_dest);
  }
}

export default SimpleGeometry;
