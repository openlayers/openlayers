/**
 * @module ol/render/Feature
 */
import Feature from '../Feature.js';
import {extend} from '../array.js';
import {
  createOrUpdateFromCoordinate,
  createOrUpdateFromFlatCoordinates,
  getCenter,
  getHeight,
} from '../extent.js';
import {memoizeOne} from '../functions.js';
import {linearRingss as linearRingssCenter} from '../geom/flat/center.js';
import {
  getInteriorPointOfArray,
  getInteriorPointsOfMultiArray,
} from '../geom/flat/interiorpoint.js';
import {interpolatePoint} from '../geom/flat/interpolate.js';
import {inflateEnds} from '../geom/flat/orient.js';
import {
  douglasPeucker,
  douglasPeuckerArray,
  quantizeArray,
} from '../geom/flat/simplify.js';
import {transform2D} from '../geom/flat/transform.js';
import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from '../geom.js';
import {get as getProjection} from '../proj.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../transform.js';

/**
 * @typedef {'Point' | 'LineString' | 'LinearRing' | 'Polygon' | 'MultiPoint' | 'MultiLineString'} Type
 * The geometry type.  One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'` or 'MultiLineString'`.
 */

/**
 * @type {import("../transform.js").Transform}
 */
const tmpTransform = createTransform();

/**
 * Lightweight, read-only, {@link module:ol/Feature~Feature} and {@link module:ol/geom/Geometry~Geometry} like
 * structure, optimized for vector tile rendering and styling. Geometry access
 * through the API is limited to getting the type and extent of the geometry.
 */
class RenderFeature {
  /**
   * @param {Type} type Geometry type.
   * @param {Array<number>} flatCoordinates Flat coordinates. These always need
   *     to be right-handed for polygons.
   * @param {Array<number>} ends Ends.
   * @param {number} stride Stride.
   * @param {Object<string, *>} properties Properties.
   * @param {number|string|undefined} id Feature id.
   */
  constructor(type, flatCoordinates, ends, stride, properties, id) {
    /**
     * @type {import("../style/Style.js").StyleFunction|undefined}
     */
    this.styleFunction;

    /**
     * @private
     * @type {import("../extent.js").Extent|undefined}
     */
    this.extent_;

    /**
     * @private
     * @type {number|string|undefined}
     */
    this.id_ = id;

    /**
     * @private
     * @type {Type}
     */
    this.type_ = type;

    /**
     * @private
     * @type {Array<number>}
     */
    this.flatCoordinates_ = flatCoordinates;

    /**
     * @private
     * @type {Array<number>}
     */
    this.flatInteriorPoints_ = null;

    /**
     * @private
     * @type {Array<number>}
     */
    this.flatMidpoints_ = null;

    /**
     * @private
     * @type {Array<number>|null}
     */
    this.ends_ = ends || null;

    /**
     * @private
     * @type {Object<string, *>}
     */
    this.properties_ = properties;

    /**
     * @private
     * @type {number}
     */
    this.squaredTolerance_;

    /**
     * @private
     * @type {number}
     */
    this.stride_ = stride;

    /**
     * @private
     * @type {RenderFeature}
     */
    this.simplifiedGeometry_;
  }

  /**
   * Get a feature property by its key.
   * @param {string} key Key
   * @return {*} Value for the requested key.
   * @api
   */
  get(key) {
    return this.properties_[key];
  }

  /**
   * Get the extent of this feature's geometry.
   * @return {import("../extent.js").Extent} Extent.
   * @api
   */
  getExtent() {
    if (!this.extent_) {
      this.extent_ =
        this.type_ === 'Point'
          ? createOrUpdateFromCoordinate(this.flatCoordinates_)
          : createOrUpdateFromFlatCoordinates(
              this.flatCoordinates_,
              0,
              this.flatCoordinates_.length,
              2,
            );
    }
    return this.extent_;
  }

  /**
   * @return {Array<number>} Flat interior points.
   */
  getFlatInteriorPoint() {
    if (!this.flatInteriorPoints_) {
      const flatCenter = getCenter(this.getExtent());
      this.flatInteriorPoints_ = getInteriorPointOfArray(
        this.flatCoordinates_,
        0,
        this.ends_,
        2,
        flatCenter,
        0,
      );
    }
    return this.flatInteriorPoints_;
  }

  /**
   * @return {Array<number>} Flat interior points.
   */
  getFlatInteriorPoints() {
    if (!this.flatInteriorPoints_) {
      const ends = inflateEnds(this.flatCoordinates_, this.ends_);
      const flatCenters = linearRingssCenter(this.flatCoordinates_, 0, ends, 2);
      this.flatInteriorPoints_ = getInteriorPointsOfMultiArray(
        this.flatCoordinates_,
        0,
        ends,
        2,
        flatCenters,
      );
    }
    return this.flatInteriorPoints_;
  }

  /**
   * @return {Array<number>} Flat midpoint.
   */
  getFlatMidpoint() {
    if (!this.flatMidpoints_) {
      this.flatMidpoints_ = interpolatePoint(
        this.flatCoordinates_,
        0,
        this.flatCoordinates_.length,
        2,
        0.5,
      );
    }
    return this.flatMidpoints_;
  }

  /**
   * @return {Array<number>} Flat midpoints.
   */
  getFlatMidpoints() {
    if (!this.flatMidpoints_) {
      this.flatMidpoints_ = [];
      const flatCoordinates = this.flatCoordinates_;
      let offset = 0;
      const ends = /** @type {Array<number>} */ (this.ends_);
      for (let i = 0, ii = ends.length; i < ii; ++i) {
        const end = ends[i];
        const midpoint = interpolatePoint(flatCoordinates, offset, end, 2, 0.5);
        extend(this.flatMidpoints_, midpoint);
        offset = end;
      }
    }
    return this.flatMidpoints_;
  }

  /**
   * Get the feature identifier.  This is a stable identifier for the feature and
   * is set when reading data from a remote source.
   * @return {number|string|undefined} Id.
   * @api
   */
  getId() {
    return this.id_;
  }

  /**
   * @return {Array<number>} Flat coordinates.
   */
  getOrientedFlatCoordinates() {
    return this.flatCoordinates_;
  }

  /**
   * For API compatibility with {@link module:ol/Feature~Feature}, this method is useful when
   * determining the geometry type in style function (see {@link #getType}).
   * @return {RenderFeature} Feature.
   * @api
   */
  getGeometry() {
    return this;
  }

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {RenderFeature} Simplified geometry.
   */
  getSimplifiedGeometry(squaredTolerance) {
    return this;
  }

  /**
   * Get a transformed and simplified version of the geometry.
   * @param {number} squaredTolerance Squared tolerance.
   * @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
   * @return {RenderFeature} Simplified geometry.
   */
  simplifyTransformed(squaredTolerance, transform) {
    return this;
  }

  /**
   * Get the feature properties.
   * @return {Object<string, *>} Feature properties.
   * @api
   */
  getProperties() {
    return this.properties_;
  }

  /**
   * Get an object of all property names and values.  This has the same behavior as getProperties,
   * but is here to conform with the {@link module:ol/Feature~Feature} interface.
   * @return {Object<string, *>?} Object.
   */
  getPropertiesInternal() {
    return this.properties_;
  }

  /**
   * @return {number} Stride.
   */
  getStride() {
    return this.stride_;
  }

  /**
   * @return {import('../style/Style.js').StyleFunction|undefined} Style
   */
  getStyleFunction() {
    return this.styleFunction;
  }

  /**
   * Get the type of this feature's geometry.
   * @return {Type} Geometry type.
   * @api
   */
  getType() {
    return this.type_;
  }

  /**
   * Transform geometry coordinates from tile pixel space to projected.
   *
   * @param {import("../proj.js").ProjectionLike} projection The data projection
   */
  transform(projection) {
    projection = getProjection(projection);
    const pixelExtent = projection.getExtent();
    const projectedExtent = projection.getWorldExtent();
    if (pixelExtent && projectedExtent) {
      const scale = getHeight(projectedExtent) / getHeight(pixelExtent);
      composeTransform(
        tmpTransform,
        projectedExtent[0],
        projectedExtent[3],
        scale,
        -scale,
        0,
        0,
        0,
      );
      transform2D(
        this.flatCoordinates_,
        0,
        this.flatCoordinates_.length,
        2,
        tmpTransform,
        this.flatCoordinates_,
      );
    }
  }

  /**
   * Apply a transform function to the coordinates of the geometry.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   * @param {import("../proj.js").TransformFunction} transformFn Transform function.
   */
  applyTransform(transformFn) {
    transformFn(this.flatCoordinates_, this.flatCoordinates_, this.stride_);
  }

  /**
   * @return {RenderFeature} A cloned render feature.
   */
  clone() {
    return new RenderFeature(
      this.type_,
      this.flatCoordinates_.slice(),
      this.ends_?.slice(),
      this.stride_,
      Object.assign({}, this.properties_),
      this.id_,
    );
  }

  /**
   * @return {Array<number>|null} Ends.
   */
  getEnds() {
    return this.ends_;
  }

  /**
   * Add transform and resolution based geometry simplification to this instance.
   * @return {RenderFeature} This render feature.
   */
  enableSimplifyTransformed() {
    this.simplifyTransformed = memoizeOne((squaredTolerance, transform) => {
      if (squaredTolerance === this.squaredTolerance_) {
        return this.simplifiedGeometry_;
      }
      this.simplifiedGeometry_ = this.clone();
      if (transform) {
        this.simplifiedGeometry_.applyTransform(transform);
      }
      const simplifiedFlatCoordinates =
        this.simplifiedGeometry_.getFlatCoordinates();
      let simplifiedEnds;
      switch (this.type_) {
        case 'LineString':
          simplifiedFlatCoordinates.length = douglasPeucker(
            simplifiedFlatCoordinates,
            0,
            this.simplifiedGeometry_.flatCoordinates_.length,
            this.simplifiedGeometry_.stride_,
            squaredTolerance,
            simplifiedFlatCoordinates,
            0,
          );
          simplifiedEnds = [simplifiedFlatCoordinates.length];
          break;
        case 'MultiLineString':
          simplifiedEnds = [];
          simplifiedFlatCoordinates.length = douglasPeuckerArray(
            simplifiedFlatCoordinates,
            0,
            this.simplifiedGeometry_.ends_,
            this.simplifiedGeometry_.stride_,
            squaredTolerance,
            simplifiedFlatCoordinates,
            0,
            simplifiedEnds,
          );
          break;
        case 'Polygon':
          simplifiedEnds = [];
          simplifiedFlatCoordinates.length = quantizeArray(
            simplifiedFlatCoordinates,
            0,
            this.simplifiedGeometry_.ends_,
            this.simplifiedGeometry_.stride_,
            Math.sqrt(squaredTolerance),
            simplifiedFlatCoordinates,
            0,
            simplifiedEnds,
          );
          break;
        default:
      }
      if (simplifiedEnds) {
        this.simplifiedGeometry_ = new RenderFeature(
          this.type_,
          simplifiedFlatCoordinates,
          simplifiedEnds,
          2,
          this.properties_,
          this.id_,
        );
      }
      this.squaredTolerance_ = squaredTolerance;
      return this.simplifiedGeometry_;
    });
    return this;
  }
}

/**
 * @return {Array<number>} Flat coordinates.
 */
RenderFeature.prototype.getFlatCoordinates =
  RenderFeature.prototype.getOrientedFlatCoordinates;

/**
 * Create a geometry from an `ol/render/Feature`
 * @param {RenderFeature} renderFeature
 * Render Feature
 * @return {Point|MultiPoint|LineString|MultiLineString|Polygon|MultiPolygon}
 * New geometry instance.
 * @api
 */
export function toGeometry(renderFeature) {
  const geometryType = renderFeature.getType();
  switch (geometryType) {
    case 'Point':
      return new Point(renderFeature.getFlatCoordinates());
    case 'MultiPoint':
      return new MultiPoint(renderFeature.getFlatCoordinates(), 'XY');
    case 'LineString':
      return new LineString(renderFeature.getFlatCoordinates(), 'XY');
    case 'MultiLineString':
      return new MultiLineString(
        renderFeature.getFlatCoordinates(),
        'XY',
        /** @type {Array<number>} */ (renderFeature.getEnds()),
      );
    case 'Polygon':
      const flatCoordinates = renderFeature.getFlatCoordinates();
      const ends = renderFeature.getEnds();
      const endss = inflateEnds(flatCoordinates, ends);
      return endss.length > 1
        ? new MultiPolygon(flatCoordinates, 'XY', endss)
        : new Polygon(flatCoordinates, 'XY', ends);
    default:
      throw new Error('Invalid geometry type:' + geometryType);
  }
}

/**
 * Create an `ol/Feature` from an `ol/render/Feature`
 * @param {RenderFeature} renderFeature RenderFeature
 * @param {string} [geometryName] Geometry name to use
 * when creating the Feature.
 * @return {Feature} Newly constructed `ol/Feature` with properties,
 * geometry, and id copied over.
 * @api
 */
export function toFeature(renderFeature, geometryName) {
  const id = renderFeature.getId();
  const geometry = toGeometry(renderFeature);
  const properties = renderFeature.getProperties();
  const feature = new Feature();
  if (geometryName !== undefined) {
    feature.setGeometryName(geometryName);
  }
  feature.setGeometry(geometry);
  if (id !== undefined) {
    feature.setId(id);
  }
  feature.setProperties(properties, true);
  return feature;
}

export default RenderFeature;
