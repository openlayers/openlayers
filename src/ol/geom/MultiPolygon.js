/**
 * @module ol/geom/MultiPolygon
 */
import {inherits} from '../util.js';
import {extend} from '../array.js';
import {closestSquaredDistanceXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import MultiPoint from '../geom/MultiPoint.js';
import Polygon from '../geom/Polygon.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {linearRingss as linearRingssArea} from '../geom/flat/area.js';
import {linearRingss as linearRingssCenter} from '../geom/flat/center.js';
import {assignClosestMultiArrayPoint, multiArrayMaxSquaredDelta} from '../geom/flat/closest.js';
import {linearRingssContainsXY} from '../geom/flat/contains.js';
import {deflateMultiCoordinatesArray} from '../geom/flat/deflate.js';
import {inflateMultiCoordinatesArray} from '../geom/flat/inflate.js';
import {getInteriorPointsOfMultiArray} from '../geom/flat/interiorpoint.js';
import {intersectsLinearRingMultiArray} from '../geom/flat/intersectsextent.js';
import {linearRingsAreOriented, orientLinearRingsArray} from '../geom/flat/orient.js';
import {quantizeMultiArray} from '../geom/flat/simplify.js';

/**
 * @classdesc
 * Multi-polygon geometry.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {Array.<Array.<Array.<module:ol/coordinate~Coordinate>>>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const MultiPolygon = function(coordinates, opt_layout) {

  SimpleGeometry.call(this);

  /**
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.endss_ = [];

  /**
   * @private
   * @type {number}
   */
  this.flatInteriorPointsRevision_ = -1;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.flatInteriorPoints_ = null;

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

  /**
   * @private
   * @type {number}
   */
  this.orientedRevision_ = -1;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.orientedFlatCoordinates_ = null;

  this.setCoordinates(coordinates, opt_layout);

};

inherits(MultiPolygon, SimpleGeometry);


/**
 * Append the passed polygon to this multipolygon.
 * @param {module:ol/geom/Polygon} polygon Polygon.
 * @api
 */
MultiPolygon.prototype.appendPolygon = function(polygon) {
  /** @type {Array.<number>} */
  let ends;
  if (!this.flatCoordinates) {
    this.flatCoordinates = polygon.getFlatCoordinates().slice();
    ends = polygon.getEnds().slice();
    this.endss_.push();
  } else {
    const offset = this.flatCoordinates.length;
    extend(this.flatCoordinates, polygon.getFlatCoordinates());
    ends = polygon.getEnds().slice();
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      ends[i] += offset;
    }
  }
  this.endss_.push(ends);
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/MultiPolygon} Clone.
 * @override
 * @api
 */
MultiPolygon.prototype.clone = function() {
  const multiPolygon = new MultiPolygon(null);

  const len = this.endss_.length;
  const newEndss = new Array(len);
  for (let i = 0; i < len; ++i) {
    newEndss[i] = this.endss_[i].slice();
  }

  multiPolygon.setFlatCoordinates(
    this.layout, this.flatCoordinates.slice(), newEndss);
  return multiPolygon;
};


/**
 * @inheritDoc
 */
MultiPolygon.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(multiArrayMaxSquaredDelta(
      this.flatCoordinates, 0, this.endss_, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return assignClosestMultiArrayPoint(
    this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
    this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * @inheritDoc
 */
MultiPolygon.prototype.containsXY = function(x, y) {
  return linearRingssContainsXY(this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, x, y);
};


/**
 * Return the area of the multipolygon on projected plane.
 * @return {number} Area (on projected plane).
 * @api
 */
MultiPolygon.prototype.getArea = function() {
  return linearRingssArea(this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride);
};


/**
 * Get the coordinate array for this geometry.  This array has the structure
 * of a GeoJSON coordinate array for multi-polygons.
 *
 * @param {boolean=} opt_right Orient coordinates according to the right-hand
 *     rule (counter-clockwise for exterior and clockwise for interior rings).
 *     If `false`, coordinates will be oriented according to the left-hand rule
 *     (clockwise for exterior and counter-clockwise for interior rings).
 *     By default, coordinate orientation will depend on how the geometry was
 *     constructed.
 * @return {Array.<Array.<Array.<module:ol/coordinate~Coordinate>>>} Coordinates.
 * @override
 * @api
 */
MultiPolygon.prototype.getCoordinates = function(opt_right) {
  let flatCoordinates;
  if (opt_right !== undefined) {
    flatCoordinates = this.getOrientedFlatCoordinates().slice();
    orientLinearRingsArray(
      flatCoordinates, 0, this.endss_, this.stride, opt_right);
  } else {
    flatCoordinates = this.flatCoordinates;
  }

  return inflateMultiCoordinatesArray(
    flatCoordinates, 0, this.endss_, this.stride);
};


/**
 * @return {Array.<Array.<number>>} Endss.
 */
MultiPolygon.prototype.getEndss = function() {
  return this.endss_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
MultiPolygon.prototype.getFlatInteriorPoints = function() {
  if (this.flatInteriorPointsRevision_ != this.getRevision()) {
    const flatCenters = linearRingssCenter(
      this.flatCoordinates, 0, this.endss_, this.stride);
    this.flatInteriorPoints_ = getInteriorPointsOfMultiArray(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
      flatCenters);
    this.flatInteriorPointsRevision_ = this.getRevision();
  }
  return this.flatInteriorPoints_;
};


/**
 * Return the interior points as {@link module:ol/geom/MultiPoint multipoint}.
 * @return {module:ol/geom/MultiPoint} Interior points as XYM coordinates, where M is
 * the length of the horizontal intersection that the point belongs to.
 * @api
 */
MultiPolygon.prototype.getInteriorPoints = function() {
  const interiorPoints = new MultiPoint(null);
  interiorPoints.setFlatCoordinates(GeometryLayout.XYM,
    this.getFlatInteriorPoints().slice());
  return interiorPoints;
};


/**
 * @return {Array.<number>} Oriented flat coordinates.
 */
MultiPolygon.prototype.getOrientedFlatCoordinates = function() {
  if (this.orientedRevision_ != this.getRevision()) {
    const flatCoordinates = this.flatCoordinates;
    if (linearRingsAreOriented(
      flatCoordinates, 0, this.endss_, this.stride)) {
      this.orientedFlatCoordinates_ = flatCoordinates;
    } else {
      this.orientedFlatCoordinates_ = flatCoordinates.slice();
      this.orientedFlatCoordinates_.length =
          orientLinearRingsArray(
            this.orientedFlatCoordinates_, 0, this.endss_, this.stride);
    }
    this.orientedRevision_ = this.getRevision();
  }
  return this.orientedFlatCoordinates_;
};


/**
 * @inheritDoc
 */
MultiPolygon.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  const simplifiedFlatCoordinates = [];
  const simplifiedEndss = [];
  simplifiedFlatCoordinates.length = quantizeMultiArray(
    this.flatCoordinates, 0, this.endss_, this.stride,
    Math.sqrt(squaredTolerance),
    simplifiedFlatCoordinates, 0, simplifiedEndss);
  const simplifiedMultiPolygon = new MultiPolygon(null);
  simplifiedMultiPolygon.setFlatCoordinates(
    GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEndss);
  return simplifiedMultiPolygon;
};


/**
 * Return the polygon at the specified index.
 * @param {number} index Index.
 * @return {module:ol/geom/Polygon} Polygon.
 * @api
 */
MultiPolygon.prototype.getPolygon = function(index) {
  if (index < 0 || this.endss_.length <= index) {
    return null;
  }
  let offset;
  if (index === 0) {
    offset = 0;
  } else {
    const prevEnds = this.endss_[index - 1];
    offset = prevEnds[prevEnds.length - 1];
  }
  const ends = this.endss_[index].slice();
  const end = ends[ends.length - 1];
  if (offset !== 0) {
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      ends[i] -= offset;
    }
  }
  const polygon = new Polygon(null);
  polygon.setFlatCoordinates(
    this.layout, this.flatCoordinates.slice(offset, end), ends);
  return polygon;
};


/**
 * Return the polygons of this multipolygon.
 * @return {Array.<module:ol/geom/Polygon>} Polygons.
 * @api
 */
MultiPolygon.prototype.getPolygons = function() {
  const layout = this.layout;
  const flatCoordinates = this.flatCoordinates;
  const endss = this.endss_;
  const polygons = [];
  let offset = 0;
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i].slice();
    const end = ends[ends.length - 1];
    if (offset !== 0) {
      for (let j = 0, jj = ends.length; j < jj; ++j) {
        ends[j] -= offset;
      }
    }
    const polygon = new Polygon(null);
    polygon.setFlatCoordinates(
      layout, flatCoordinates.slice(offset, end), ends);
    polygons.push(polygon);
    offset = end;
  }
  return polygons;
};


/**
 * @inheritDoc
 * @api
 */
MultiPolygon.prototype.getType = function() {
  return GeometryType.MULTI_POLYGON;
};


/**
 * @inheritDoc
 * @api
 */
MultiPolygon.prototype.intersectsExtent = function(extent) {
  return intersectsLinearRingMultiArray(
    this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, extent);
};


/**
 * Set the coordinates of the multipolygon.
 * @param {Array.<Array.<Array.<module:ol/coordinate~Coordinate>>>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
MultiPolygon.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(GeometryLayout.XY, null, this.endss_);
  } else {
    this.setLayout(opt_layout, coordinates, 3);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    const endss = deflateMultiCoordinatesArray(
      this.flatCoordinates, 0, coordinates, this.stride, this.endss_);
    if (endss.length === 0) {
      this.flatCoordinates.length = 0;
    } else {
      const lastEnds = endss[endss.length - 1];
      this.flatCoordinates.length = lastEnds.length === 0 ?
        0 : lastEnds[lastEnds.length - 1];
    }
    this.changed();
  }
};


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} endss Endss.
 */
MultiPolygon.prototype.setFlatCoordinates = function(layout, flatCoordinates, endss) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.endss_ = endss;
  this.changed();
};


/**
 * @param {Array.<module:ol/geom/Polygon>} polygons Polygons.
 */
MultiPolygon.prototype.setPolygons = function(polygons) {
  let layout = this.getLayout();
  const flatCoordinates = [];
  const endss = [];
  for (let i = 0, ii = polygons.length; i < ii; ++i) {
    const polygon = polygons[i];
    if (i === 0) {
      layout = polygon.getLayout();
    }
    const offset = flatCoordinates.length;
    const ends = polygon.getEnds();
    for (let j = 0, jj = ends.length; j < jj; ++j) {
      ends[j] += offset;
    }
    extend(flatCoordinates, polygon.getFlatCoordinates());
    endss.push(ends);
  }
  this.setFlatCoordinates(layout, flatCoordinates, endss);
};

export default MultiPolygon;
