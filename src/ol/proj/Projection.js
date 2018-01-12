/**
 * @module ol/proj/Projection
 */
import Units from '../proj/Units.js';

/**
 * @classdesc
 * Projection definition class. One of these is created for each projection
 * supported in the application and stored in the {@link ol.proj} namespace.
 * You can use these in applications, but this is not required, as API params
 * and options use {@link ol.ProjectionLike} which means the simple string
 * code will suffice.
 *
 * You can use {@link ol.proj.get} to retrieve the object for a particular
 * projection.
 *
 * The library includes definitions for `EPSG:4326` and `EPSG:3857`, together
 * with the following aliases:
 * * `EPSG:4326`: CRS:84, urn:ogc:def:crs:EPSG:6.6:4326,
 *     urn:ogc:def:crs:OGC:1.3:CRS84, urn:ogc:def:crs:OGC:2:84,
 *     http://www.opengis.net/gml/srs/epsg.xml#4326,
 *     urn:x-ogc:def:crs:EPSG:4326
 * * `EPSG:3857`: EPSG:102100, EPSG:102113, EPSG:900913,
 *     urn:ogc:def:crs:EPSG:6.18:3:3857,
 *     http://www.opengis.net/gml/srs/epsg.xml#3857
 *
 * If you use proj4js, aliases can be added using `proj4.defs()`; see
 * [documentation](https://github.com/proj4js/proj4js). To set an alternative
 * namespace for proj4, use {@link ol.proj.setProj4}.
 *
 * @constructor
 * @param {olx.ProjectionOptions} options Projection options.
 * @struct
 * @api
 */
const Projection = function(options) {
  /**
   * @private
   * @type {string}
   */
  this.code_ = options.code;

  /**
   * Units of projected coordinates. When set to `ol.proj.Units.TILE_PIXELS`, a
   * `this.extent_` and `this.worldExtent_` must be configured properly for each
   * tile.
   * @private
   * @type {ol.proj.Units}
   */
  this.units_ = /** @type {ol.proj.Units} */ (options.units);

  /**
   * Validity extent of the projection in projected coordinates. For projections
   * with `ol.proj.Units.TILE_PIXELS` units, this is the extent of the tile in
   * tile pixel space.
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = options.extent !== undefined ? options.extent : null;

  /**
   * Extent of the world in EPSG:4326. For projections with
   * `ol.proj.Units.TILE_PIXELS` units, this is the extent of the tile in
   * projected coordinate space.
   * @private
   * @type {ol.Extent}
   */
  this.worldExtent_ = options.worldExtent !== undefined ?
    options.worldExtent : null;

  /**
   * @private
   * @type {string}
   */
  this.axisOrientation_ = options.axisOrientation !== undefined ?
    options.axisOrientation : 'enu';

  /**
   * @private
   * @type {boolean}
   */
  this.global_ = options.global !== undefined ? options.global : false;

  /**
   * @private
   * @type {boolean}
   */
  this.canWrapX_ = !!(this.global_ && this.extent_);

  /**
   * @private
   * @type {function(number, ol.Coordinate):number|undefined}
   */
  this.getPointResolutionFunc_ = options.getPointResolution;

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.defaultTileGrid_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.metersPerUnit_ = options.metersPerUnit;
};


/**
 * @return {boolean} The projection is suitable for wrapping the x-axis
 */
Projection.prototype.canWrapX = function() {
  return this.canWrapX_;
};


/**
 * Get the code for this projection, e.g. 'EPSG:4326'.
 * @return {string} Code.
 * @api
 */
Projection.prototype.getCode = function() {
  return this.code_;
};


/**
 * Get the validity extent for this projection.
 * @return {ol.Extent} Extent.
 * @api
 */
Projection.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Get the units of this projection.
 * @return {ol.proj.Units} Units.
 * @api
 */
Projection.prototype.getUnits = function() {
  return this.units_;
};


/**
 * Get the amount of meters per unit of this projection.  If the projection is
 * not configured with `metersPerUnit` or a units identifier, the return is
 * `undefined`.
 * @return {number|undefined} Meters.
 * @api
 */
Projection.prototype.getMetersPerUnit = function() {
  return this.metersPerUnit_ || Units.METERS_PER_UNIT[this.units_];
};


/**
 * Get the world extent for this projection.
 * @return {ol.Extent} Extent.
 * @api
 */
Projection.prototype.getWorldExtent = function() {
  return this.worldExtent_;
};


/**
 * Get the axis orientation of this projection.
 * Example values are:
 * enu - the default easting, northing, elevation.
 * neu - northing, easting, up - useful for "lat/long" geographic coordinates,
 *     or south orientated transverse mercator.
 * wnu - westing, northing, up - some planetary coordinate systems have
 *     "west positive" coordinate systems
 * @return {string} Axis orientation.
 * @api
 */
Projection.prototype.getAxisOrientation = function() {
  return this.axisOrientation_;
};


/**
 * Is this projection a global projection which spans the whole world?
 * @return {boolean} Whether the projection is global.
 * @api
 */
Projection.prototype.isGlobal = function() {
  return this.global_;
};


/**
* Set if the projection is a global projection which spans the whole world
* @param {boolean} global Whether the projection is global.
* @api
*/
Projection.prototype.setGlobal = function(global) {
  this.global_ = global;
  this.canWrapX_ = !!(global && this.extent_);
};


/**
 * @return {ol.tilegrid.TileGrid} The default tile grid.
 */
Projection.prototype.getDefaultTileGrid = function() {
  return this.defaultTileGrid_;
};


/**
 * @param {ol.tilegrid.TileGrid} tileGrid The default tile grid.
 */
Projection.prototype.setDefaultTileGrid = function(tileGrid) {
  this.defaultTileGrid_ = tileGrid;
};


/**
 * Set the validity extent for this projection.
 * @param {ol.Extent} extent Extent.
 * @api
 */
Projection.prototype.setExtent = function(extent) {
  this.extent_ = extent;
  this.canWrapX_ = !!(this.global_ && extent);
};


/**
 * Set the world extent for this projection.
 * @param {ol.Extent} worldExtent World extent
 *     [minlon, minlat, maxlon, maxlat].
 * @api
 */
Projection.prototype.setWorldExtent = function(worldExtent) {
  this.worldExtent_ = worldExtent;
};


/**
 * Set the getPointResolution function (see {@link ol.proj#getPointResolution}
 * for this projection.
 * @param {function(number, ol.Coordinate):number} func Function
 * @api
 */
Projection.prototype.setGetPointResolution = function(func) {
  this.getPointResolutionFunc_ = func;
};


/**
 * Get the custom point resolution function for this projection (if set).
 * @return {function(number, ol.Coordinate):number|undefined} The custom point
 * resolution function (if set).
 */
Projection.prototype.getPointResolutionFunc = function() {
  return this.getPointResolutionFunc_;
};
export default Projection;
