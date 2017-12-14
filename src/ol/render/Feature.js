/**
 * @module ol/render/Feature
 */
import {nullFunction} from '../index.js';
import _ol_array_ from '../array.js';
import {createOrUpdateFromCoordinate, createOrUpdateFromFlatCoordinates, getCenter, getHeight} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import _ol_geom_flat_center_ from '../geom/flat/center.js';
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
var _ol_render_Feature_ = function(type, flatCoordinates, ends, properties, id) {
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
_ol_render_Feature_.prototype.get = function(key) {
  return this.properties_[key];
};


/**
 * @return {Array.<number>|Array.<Array.<number>>} Ends or endss.
 */
_ol_render_Feature_.prototype.getEnds =
_ol_render_Feature_.prototype.getEndss = function() {
  return this.ends_;
};


/**
 * Get the extent of this feature's geometry.
 * @return {ol.Extent} Extent.
 * @api
 */
_ol_render_Feature_.prototype.getExtent = function() {
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
_ol_render_Feature_.prototype.getFlatInteriorPoint = function() {
  if (!this.flatInteriorPoints_) {
    var flatCenter = getCenter(this.getExtent());
    this.flatInteriorPoints_ = _ol_geom_flat_interiorpoint_.linearRings(
        this.flatCoordinates_, 0, this.ends_, 2, flatCenter, 0);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
_ol_render_Feature_.prototype.getFlatInteriorPoints = function() {
  if (!this.flatInteriorPoints_) {
    var flatCenters = _ol_geom_flat_center_.linearRingss(
        this.flatCoordinates_, 0, this.ends_, 2);
    this.flatInteriorPoints_ = _ol_geom_flat_interiorpoint_.linearRingss(
        this.flatCoordinates_, 0, this.ends_, 2, flatCenters);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat midpoint.
 */
_ol_render_Feature_.prototype.getFlatMidpoint = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = _ol_geom_flat_interpolate_.lineString(
        this.flatCoordinates_, 0, this.flatCoordinates_.length, 2, 0.5);
  }
  return this.flatMidpoints_;
};


/**
 * @return {Array.<number>} Flat midpoints.
 */
_ol_render_Feature_.prototype.getFlatMidpoints = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = [];
    var flatCoordinates = this.flatCoordinates_;
    var offset = 0;
    var ends = this.ends_;
    for (var i = 0, ii = ends.length; i < ii; ++i) {
      var end = ends[i];
      var midpoint = _ol_geom_flat_interpolate_.lineString(
          flatCoordinates, offset, end, 2, 0.5);
      _ol_array_.extend(this.flatMidpoints_, midpoint);
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
_ol_render_Feature_.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
_ol_render_Feature_.prototype.getOrientedFlatCoordinates = function() {
  return this.flatCoordinates_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
_ol_render_Feature_.prototype.getFlatCoordinates =
    _ol_render_Feature_.prototype.getOrientedFlatCoordinates;


/**
 * For API compatibility with {@link ol.Feature}, this method is useful when
 * determining the geometry type in style function (see {@link #getType}).
 * @return {ol.render.Feature} Feature.
 * @api
 */
_ol_render_Feature_.prototype.getGeometry = function() {
  return this;
};


/**
 * Get the feature properties.
 * @return {Object.<string, *>} Feature properties.
 * @api
 */
_ol_render_Feature_.prototype.getProperties = function() {
  return this.properties_;
};


/**
 * Get the feature for working with its geometry.
 * @return {ol.render.Feature} Feature.
 */
_ol_render_Feature_.prototype.getSimplifiedGeometry =
    _ol_render_Feature_.prototype.getGeometry;


/**
 * @return {number} Stride.
 */
_ol_render_Feature_.prototype.getStride = function() {
  return 2;
};


/**
 * @return {undefined}
 */
_ol_render_Feature_.prototype.getStyleFunction = nullFunction;


/**
 * Get the type of this feature's geometry.
 * @return {ol.geom.GeometryType} Geometry type.
 * @api
 */
_ol_render_Feature_.prototype.getType = function() {
  return this.type_;
};

/**
 * Transform geometry coordinates from tile pixel space to projected.
 * The SRS of the source and destination are expected to be the same.
 *
 * @param {ol.ProjectionLike} source The current projection
 * @param {ol.ProjectionLike} destination The desired projection.
 */
_ol_render_Feature_.prototype.transform = function(source, destination) {
  var pixelExtent = source.getExtent();
  var projectedExtent = source.getWorldExtent();
  var scale = getHeight(projectedExtent) / getHeight(pixelExtent);
  var transform = this.tmpTransform_;
  _ol_transform_.compose(transform,
      projectedExtent[0], projectedExtent[3],
      scale, -scale, 0,
      0, 0);
  _ol_geom_flat_transform_.transform2D(this.flatCoordinates_, 0, this.flatCoordinates_.length, 2,
      transform, this.flatCoordinates_);
};
export default _ol_render_Feature_;
