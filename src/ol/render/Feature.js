/**
 * @module ol/render/Feature
 */
import {nullFunction} from '../index.js';
import {extend} from '../array.js';
import {createOrUpdateFromCoordinate, createOrUpdateFromFlatCoordinates, getCenter, getHeight} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import {linearRingss as linearRingssCenter} from '../geom/flat/center.js';
import _ol_geom_flat_interiorpoint_ from '../geom/flat/interiorpoint.js';
import _ol_geom_flat_interpolate_ from '../geom/flat/interpolate.js';
import _ol_geom_flat_transform_ from '../geom/flat/transform.js';
import _ol_transform_ from '../transform.js';

/**
 * Lightweight, read-only, {@link ol.Feature} and {@link ol.geom.Geometry} like
 * structure, optimized for vector tile rendering and styling. Geometry access
 * through the API is limited to getting the type and extent of the geometry.
 *
 * @constructor
 * @param {ol.geom.GeometryType} type Geometry type.
 * @param {Array.<number>} flatCoordinates Flat coordinates. These always need
 *     to be right-handed for polygons.
 * @param {Array.<number>|Array.<Array.<number>>} ends Ends or Endss.
 * @param {Object.<string, *>} properties Properties.
 * @param {number|string|undefined} id Feature id.
 */
const RenderFeature = function(type, flatCoordinates, ends, properties, id) {
  /**
   * @private
   * @type {ol.Extent|undefined}
   */
  this.extent_;

  /**
   * @private
   * @type {number|string|undefined}
   */
  this.id_ = id;

  /**
   * @private
   * @type {ol.geom.GeometryType}
   */
  this.type_ = type;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.flatCoordinates_ = flatCoordinates;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.flatInteriorPoints_ = null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.flatMidpoints_ = null;

  /**
   * @private
   * @type {Array.<number>|Array.<Array.<number>>}
   */
  this.ends_ = ends;

  /**
   * @private
   * @type {Object.<string, *>}
   */
  this.properties_ = properties;


  /**
   * @private
   * @type {ol.Transform}
   */
  this.tmpTransform_ = _ol_transform_.create();
};


/**
 * Get a feature property by its key.
 * @param {string} key Key
 * @return {*} Value for the requested key.
 * @api
 */
RenderFeature.prototype.get = function(key) {
  return this.properties_[key];
};


/**
 * @return {Array.<number>|Array.<Array.<number>>} Ends or endss.
 */
RenderFeature.prototype.getEnds =
RenderFeature.prototype.getEndss = function() {
  return this.ends_;
};


/**
 * Get the extent of this feature's geometry.
 * @return {ol.Extent} Extent.
 * @api
 */
RenderFeature.prototype.getExtent = function() {
  if (!this.extent_) {
    this.extent_ = this.type_ === GeometryType.POINT ?
      createOrUpdateFromCoordinate(this.flatCoordinates_) :
      createOrUpdateFromFlatCoordinates(
        this.flatCoordinates_, 0, this.flatCoordinates_.length, 2);

  }
  return this.extent_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
RenderFeature.prototype.getFlatInteriorPoint = function() {
  if (!this.flatInteriorPoints_) {
    const flatCenter = getCenter(this.getExtent());
    this.flatInteriorPoints_ = _ol_geom_flat_interiorpoint_.linearRings(
      this.flatCoordinates_, 0, this.ends_, 2, flatCenter, 0);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
RenderFeature.prototype.getFlatInteriorPoints = function() {
  if (!this.flatInteriorPoints_) {
    const flatCenters = linearRingssCenter(
      this.flatCoordinates_, 0, this.ends_, 2);
    this.flatInteriorPoints_ = _ol_geom_flat_interiorpoint_.linearRingss(
      this.flatCoordinates_, 0, this.ends_, 2, flatCenters);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat midpoint.
 */
RenderFeature.prototype.getFlatMidpoint = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = _ol_geom_flat_interpolate_.lineString(
      this.flatCoordinates_, 0, this.flatCoordinates_.length, 2, 0.5);
  }
  return this.flatMidpoints_;
};


/**
 * @return {Array.<number>} Flat midpoints.
 */
RenderFeature.prototype.getFlatMidpoints = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = [];
    const flatCoordinates = this.flatCoordinates_;
    let offset = 0;
    const ends = this.ends_;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const midpoint = _ol_geom_flat_interpolate_.lineString(
        flatCoordinates, offset, end, 2, 0.5);
      extend(this.flatMidpoints_, midpoint);
      offset = end;
    }
  }
  return this.flatMidpoints_;
};

/**
 * Get the feature identifier.  This is a stable identifier for the feature and
 * is set when reading data from a remote source.
 * @return {number|string|undefined} Id.
 * @api
 */
RenderFeature.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
RenderFeature.prototype.getOrientedFlatCoordinates = function() {
  return this.flatCoordinates_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
RenderFeature.prototype.getFlatCoordinates =
    RenderFeature.prototype.getOrientedFlatCoordinates;


/**
 * For API compatibility with {@link ol.Feature}, this method is useful when
 * determining the geometry type in style function (see {@link #getType}).
 * @return {ol.render.Feature} Feature.
 * @api
 */
RenderFeature.prototype.getGeometry = function() {
  return this;
};


/**
 * Get the feature properties.
 * @return {Object.<string, *>} Feature properties.
 * @api
 */
RenderFeature.prototype.getProperties = function() {
  return this.properties_;
};


/**
 * Get the feature for working with its geometry.
 * @return {ol.render.Feature} Feature.
 */
RenderFeature.prototype.getSimplifiedGeometry =
    RenderFeature.prototype.getGeometry;


/**
 * @return {number} Stride.
 */
RenderFeature.prototype.getStride = function() {
  return 2;
};


/**
 * @return {undefined}
 */
RenderFeature.prototype.getStyleFunction = nullFunction;


/**
 * Get the type of this feature's geometry.
 * @return {ol.geom.GeometryType} Geometry type.
 * @api
 */
RenderFeature.prototype.getType = function() {
  return this.type_;
};

/**
 * Transform geometry coordinates from tile pixel space to projected.
 * The SRS of the source and destination are expected to be the same.
 *
 * @param {ol.ProjectionLike} source The current projection
 * @param {ol.ProjectionLike} destination The desired projection.
 */
RenderFeature.prototype.transform = function(source, destination) {
  const pixelExtent = source.getExtent();
  const projectedExtent = source.getWorldExtent();
  const scale = getHeight(projectedExtent) / getHeight(pixelExtent);
  const transform = this.tmpTransform_;
  _ol_transform_.compose(transform,
    projectedExtent[0], projectedExtent[3],
    scale, -scale, 0,
    0, 0);
  _ol_geom_flat_transform_.transform2D(this.flatCoordinates_, 0, this.flatCoordinates_.length, 2,
    transform, this.flatCoordinates_);
};
export default RenderFeature;
