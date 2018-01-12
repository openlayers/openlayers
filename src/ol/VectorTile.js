/**
 * @module ol/VectorTile
 */
import {getUid, inherits} from './index.js';
import Tile from './Tile.js';
import TileState from './TileState.js';

/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Data source url.
 * @param {ol.format.Feature} format Feature format.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @param {olx.TileOptions=} opt_options Tile options.
 */
const VectorTile = function(tileCoord, state, src, format, tileLoadFunction, opt_options) {

  Tile.call(this, tileCoord, state, opt_options);

  /**
   * @type {number}
   */
  this.consumers = 0;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = null;

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = format;

  /**
   * @private
   * @type {Array.<ol.Feature>}
   */
  this.features_ = null;

  /**
   * @private
   * @type {ol.FeatureLoader}
   */
  this.loader_;

  /**
   * Data projection
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_;

  /**
   * @private
   * @type {Object.<string, ol.render.ReplayGroup>}
   */
  this.replayGroups_ = {};

  /**
   * @private
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction_ = tileLoadFunction;

  /**
   * @private
   * @type {string}
   */
  this.url_ = src;

};

inherits(VectorTile, Tile);

/**
 * @const
 * @type {ol.Extent}
 */
const DEFAULT_EXTENT = [0, 0, 4096, 4096];


/**
 * @inheritDoc
 */
VectorTile.prototype.disposeInternal = function() {
  this.features_ = null;
  this.replayGroups_ = {};
  this.state = TileState.ABORT;
  this.changed();
  Tile.prototype.disposeInternal.call(this);
};


/**
 * Gets the extent of the vector tile.
 * @return {ol.Extent} The extent.
 * @api
 */
VectorTile.prototype.getExtent = function() {
  return this.extent_ || DEFAULT_EXTENT;
};


/**
 * Get the feature format assigned for reading this tile's features.
 * @return {ol.format.Feature} Feature format.
 * @api
 */
VectorTile.prototype.getFormat = function() {
  return this.format_;
};


/**
 * Get the features for this tile. Geometries will be in the projection returned
 * by {@link ol.VectorTile#getProjection}.
 * @return {Array.<ol.Feature|ol.render.Feature>} Features.
 * @api
 */
VectorTile.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @inheritDoc
 */
VectorTile.prototype.getKey = function() {
  return this.url_;
};


/**
 * Get the feature projection of features returned by
 * {@link ol.VectorTile#getFeatures}.
 * @return {ol.proj.Projection} Feature projection.
 * @api
 */
VectorTile.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @param {string} key Key.
 * @return {ol.render.ReplayGroup} Replay group.
 */
VectorTile.prototype.getReplayGroup = function(layer, key) {
  return this.replayGroups_[getUid(layer) + ',' + key];
};


/**
 * @inheritDoc
 */
VectorTile.prototype.load = function() {
  if (this.state == TileState.IDLE) {
    this.setState(TileState.LOADING);
    this.tileLoadFunction_(this, this.url_);
    this.loader_(null, NaN, null);
  }
};


/**
 * Handler for successful tile load.
 * @param {Array.<ol.Feature>} features The loaded features.
 * @param {ol.proj.Projection} dataProjection Data projection.
 * @param {ol.Extent} extent Extent.
 */
VectorTile.prototype.onLoad = function(features, dataProjection, extent) {
  this.setProjection(dataProjection);
  this.setFeatures(features);
  this.setExtent(extent);
};


/**
 * Handler for tile load errors.
 */
VectorTile.prototype.onError = function() {
  this.setState(TileState.ERROR);
};


/**
 * Function for use in an {@link ol.source.VectorTile}'s `tileLoadFunction`.
 * Sets the extent of the vector tile. This is only required for tiles in
 * projections with `tile-pixels` as units. The extent should be set to
 * `[0, 0, tilePixelSize, tilePixelSize]`, where `tilePixelSize` is calculated
 * by multiplying the tile size with the tile pixel ratio. For sources using
 * {@link ol.format.MVT} as feature format, the
 * {@link ol.format.MVT#getLastExtent} method will return the correct extent.
 * The default is `[0, 0, 4096, 4096]`.
 * @param {ol.Extent} extent The extent.
 * @api
 */
VectorTile.prototype.setExtent = function(extent) {
  this.extent_ = extent;
};


/**
 * Function for use in an {@link ol.source.VectorTile}'s `tileLoadFunction`.
 * Sets the features for the tile.
 * @param {Array.<ol.Feature>} features Features.
 * @api
 */
VectorTile.prototype.setFeatures = function(features) {
  this.features_ = features;
  this.setState(TileState.LOADED);
};


/**
 * Function for use in an {@link ol.source.VectorTile}'s `tileLoadFunction`.
 * Sets the projection of the features that were added with
 * {@link ol.VectorTile#setFeatures}.
 * @param {ol.proj.Projection} projection Feature projection.
 * @api
 */
VectorTile.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @param {string} key Key.
 * @param {ol.render.ReplayGroup} replayGroup Replay group.
 */
VectorTile.prototype.setReplayGroup = function(layer, key, replayGroup) {
  this.replayGroups_[getUid(layer) + ',' + key] = replayGroup;
};


/**
 * Set the feature loader for reading this tile's features.
 * @param {ol.FeatureLoader} loader Feature loader.
 * @api
 */
VectorTile.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};

export default VectorTile;
