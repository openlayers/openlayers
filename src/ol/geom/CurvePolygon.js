/**
 * @module ol/geom/CurvePolygon
 */
import GeometryType from './GeometryType.js';
import SimpleGeometry from './SimpleGeometry.js';
import {createOrUpdateEmpty, extend} from '../extent.js';
import {deflateCoordinates} from './flat/deflate.js';
import {linearRingsAreOriented, orientLinearRings} from "./flat/orient.js";
import {inflateCoordinates} from "./flat/inflate.js";

class CurvePolygonRingDescription {
  constructor(type, start, length) {
    /**
     * @type {GeometryType}
     */
    this.type = type;

    /**
     * @type {number}
     */
    this.start = start;

    /**
     * @type {number}
     */
    this.length = length;
  }
}

class CurvePolygonDescription {
  constructor() {
    /**
     * @type {Array<import("../coordinate.js").Coordinate>}
     */
    this.coordinates = [];

    /**
     * @type {Array<CurvePolygonRingDescription>}
     */
    this.ringDescriptions = [];
  }
}

class CurvePolygon extends SimpleGeometry {
  /**
   * @param {Array<import('../geom/Geometry.js').default>} [rings] rings
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   */
  constructor(rings, opt_layout) {
    super();

    /**
     * @private
     * @type {Array<import('../geom/SimpleGeometry.js').default>} [rings] rings
     */
    this.rings_ =
      /** @type {Array<import('../geom/SimpleGeometry.js').default>} */ (rings);

    this.description_ = this.createDescription();

    this.setCoordinates(
      /** @type {Array<import("../coordinate.js").Coordinate>} */ (
        this.description_.coordinates
      ),
      opt_layout
    );

    /**
     * @type {Array<number>}
     * @protected
     */
    this.ends_ = this.computeEnds();

    this.flatCoordinates = this.getOrientedFlatCoordinates();
    this.orientRings();
  }

  orientRings() {
    for (let i = 0; i < this.rings_.length; i++) {
      let flatCoords;

      if (i === 0) {
        flatCoords = this.flatCoordinates.slice(0, this.ends_[i]);
      } else {
        flatCoords = this.flatCoordinates.slice(
          this.ends_[i - 1],
          this.ends_[i]
        );
      }

      const ring = this.rings_[i];
      if (ring.getType() === GeometryType.COMPOUND_CURVE) {
        ring.setCoordinates_(inflateCoordinates(flatCoords, 0, flatCoords.length, this.stride));
      } else {
        ring.setCoordinates(
          inflateCoordinates(flatCoords, 0, flatCoords.length, this.stride)
        );
      }
    }
  }

  getRings() {
    return this.rings_;
  }

  computeEnds() {
    const ends = [];
    let i = 0;
    this.rings_.forEach((ring) => {
      const numberOfCoordinates =
        this.description_.ringDescriptions[i].length * this.stride;

      if (ends.length === 0) {
        ends.push(numberOfCoordinates);
      } else {
        ends.push(ends[i - 1] + numberOfCoordinates);
      }

      i++;
    });

    return ends;
  }

  /**
   * @return {CurvePolygonDescription} compound curve description
   */
  getDescription() {
    return this.description_;
  }

  /**
   * @private
   * @return {CurvePolygonDescription} compound curve description
   */
  createDescription() {
    const data = new CurvePolygonDescription();

    this.rings_.forEach((ring) => {
      const ringCoordinates = ring.getCoordinates();
      const ringDescription = new CurvePolygonRingDescription(
        ring.getType(),
        0,
        ringCoordinates.length
      );

      if (data.coordinates.length > 0) {
        ringDescription.start = data.coordinates.length;
      }

      data.coordinates = data.coordinates.concat(ringCoordinates);

      data.ringDescriptions.push(ringDescription);
    });

    return data;
  }

  /**
   * Set the coordinates of the polygon.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates,
      0,
      coordinates,
      this.stride
    );
    this.changed();
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!CurvePolygon} Clone.
   * @api
   */
  clone() {
    const curvePolygon = new CurvePolygon(this.rings_, this.layout);
    curvePolygon.applyProperties(this);
    return curvePolygon;
  }

  getType() {
    return GeometryType.CURVE_POLYGON;
  }

  /**
   * @return {Array<number>} Ends.
   */
  getEnds() {
    return this.ends_;
  }

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {CurvePolygon} Simplified Curve Polygon.
   * @protected
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    // At the moment, the geometry is not simplified
    return this.clone();
  }

  /**
   * @return {Array<number>} Oriented flat coordinates.
   */
  getOrientedFlatCoordinates() {
    if (this.orientedRevision_ != this.getRevision()) {
      const flatCoordinates = this.flatCoordinates;
      if (linearRingsAreOriented(flatCoordinates, 0, this.ends_, this.stride)) {
        this.orientedFlatCoordinates_ = flatCoordinates;
      } else {
        this.orientedFlatCoordinates_ = flatCoordinates.slice();
        this.orientedFlatCoordinates_.length = orientLinearRings(
          this.orientedFlatCoordinates_,
          0,
          this.ends_,
          this.stride
        );
      }
      this.orientedRevision_ = this.getRevision();
    }
    return this.orientedFlatCoordinates_;
  }

  /**
   * Apply a transform function to the coordinates of the geometry.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   * @param {import("../proj.js").TransformFunction} transformFn Transform function.
   * Called with a flat array of geometry coordinates.
   * @api
   */
  applyTransform(transformFn) {
    const rings = this.rings_;
    for (let i = 0, ii = rings.length; i < ii; ++i) {
      rings[i].applyTransform(transformFn);
    }
    this.changed();
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    createOrUpdateEmpty(extent);
    const geometries = this.rings_;
    for (let i = 0; i < geometries.length; ++i) {
      extend(extent, geometries[i].getExtent());
    }
    return extent;
  }

  intersectsExtent(extent) {
    throw Error('Method not yet supported.');
    // eslint-disable-next-line no-unreachable
    return false;
  }
}

export default CurvePolygon;
