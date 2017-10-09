goog.provide('ol.render.Feature');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.flat.center');
goog.require('ol.geom.flat.interiorpoint');
goog.require('ol.geom.flat.interpolate');
goog.require('ol.geom.flat.transform');
goog.require('ol.transform');


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
ol.render.Feature = function(type, flatCoordinates, ends, properties, id) {
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
  this.tmpTransform_ = ol.transform.create();
};


/**
 * Get a feature property by its key.
 * @param {string} key Key
 * @return {*} Value for the requested key.
 * @api
 */
ol.render.Feature.prototype.get = function(key) {
  return this.properties_[key];
};


/**
 * @return {Array.<number>|Array.<Array.<number>>} Ends or endss.
 */
ol.render.Feature.prototype.getEnds =
ol.render.Feature.prototype.getEndss = function() {
  return this.ends_;
};


/**
 * Get the extent of this feature's geometry.
 * @return {ol.Extent} Extent.
 * @api
 */
ol.render.Feature.prototype.getExtent = function() {
  if (!this.extent_) {
    this.extent_ = this.type_ === ol.geom.GeometryType.POINT ?
      ol.extent.createOrUpdateFromCoordinate(this.flatCoordinates_) :
      ol.extent.createOrUpdateFromFlatCoordinates(
          this.flatCoordinates_, 0, this.flatCoordinates_.length, 2);

  }
  return this.extent_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
ol.render.Feature.prototype.getFlatInteriorPoint = function() {
  if (!this.flatInteriorPoints_) {
    var flatCenter = ol.extent.getCenter(this.getExtent());
    this.flatInteriorPoints_ = ol.geom.flat.interiorpoint.linearRings(
        this.flatCoordinates_, 0, this.ends_, 2, flatCenter, 0);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
ol.render.Feature.prototype.getFlatInteriorPoints = function() {
  if (!this.flatInteriorPoints_) {
    var flatCenters = ol.geom.flat.center.linearRingss(
        this.flatCoordinates_, 0, this.ends_, 2);
    this.flatInteriorPoints_ = ol.geom.flat.interiorpoint.linearRingss(
        this.flatCoordinates_, 0, this.ends_, 2, flatCenters);
  }
  return this.flatInteriorPoints_;
};


/**
 * @return {Array.<number>} Flat midpoint.
 */
ol.render.Feature.prototype.getFlatMidpoint = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = ol.geom.flat.interpolate.lineString(
        this.flatCoordinates_, 0, this.flatCoordinates_.length, 2, 0.5);
  }
  return this.flatMidpoints_;
};


/**
 * @return {Array.<number>} Flat midpoints.
 */
ol.render.Feature.prototype.getFlatMidpoints = function() {
  if (!this.flatMidpoints_) {
    this.flatMidpoints_ = [];
    var flatCoordinates = this.flatCoordinates_;
    var offset = 0;
    var ends = this.ends_;
    for (var i = 0, ii = ends.length; i < ii; ++i) {
      var end = ends[i];
      var midpoint = ol.geom.flat.interpolate.lineString(
          flatCoordinates, offset, end, 2, 0.5);
      ol.array.extend(this.flatMidpoints_, midpoint);
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
ol.render.Feature.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
ol.render.Feature.prototype.getOrientedFlatCoordinates = function() {
  return this.flatCoordinates_;
};


/**
 * @return {Array.<number>} Flat coordinates.
 */
ol.render.Feature.prototype.getFlatCoordinates =
    ol.render.Feature.prototype.getOrientedFlatCoordinates;


/**
 * For API compatibility with {@link ol.Feature}, this method is useful when
 * determining the geometry type in style function (see {@link #getType}).
 * @return {ol.render.Feature} Feature.
 * @api
 */
ol.render.Feature.prototype.getGeometry = function() {
  return this;
};


/**
 * Get the feature properties.
 * @return {Object.<string, *>} Feature properties.
 * @api
 */
ol.render.Feature.prototype.getProperties = function() {
  return this.properties_;
};


/**
 * Get the feature for working with its geometry.
 * @return {ol.render.Feature} Feature.
 */
ol.render.Feature.prototype.getSimplifiedGeometry =
    ol.render.Feature.prototype.getGeometry;


/**
 * @return {number} Stride.
 */
ol.render.Feature.prototype.getStride = function() {
  return 2;
};


/**
 * @return {undefined}
 */
ol.render.Feature.prototype.getStyleFunction = ol.nullFunction;


/**
 * Get the type of this feature's geometry.
 * @return {ol.geom.GeometryType} Geometry type.
 * @api
 */
ol.render.Feature.prototype.getType = function() {
  return this.type_;
};

/**
 * Transform geometry coordinates from tile pixel space to projected.
 * The SRS of the source and destination are expected to be the same.
 *
 * @param {ol.ProjectionLike} source The current projection
 * @param {ol.ProjectionLike} destination The desired projection.
 */
ol.render.Feature.prototype.transform = function(source, destination) {
  var pixelExtent = source.getExtent();
  var projectedExtent = source.getWorldExtent();
  var scale = ol.extent.getHeight(projectedExtent) / ol.extent.getHeight(pixelExtent);
  var transform = this.tmpTransform_;
  ol.transform.compose(transform,
      projectedExtent[0], projectedExtent[3],
      scale, -scale, 0,
      0, 0);
  ol.geom.flat.transform.transform2D(this.flatCoordinates_, 0, this.flatCoordinates_.length, 2,
      transform, this.flatCoordinates_);
};
