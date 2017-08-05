goog.provide('ol.VectorTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.TileState');


/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Data source url.
 * @param {ol.format.Feature} format Feature format.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 */
ol.VectorTile = function(tileCoord, state, src, format, tileLoadFunction) {

  ol.Tile.call(this, tileCoord, state);

  /**
   * @type {number}
   */
  this.consumers = 0;

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
ol.inherits(ol.VectorTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.disposeInternal = function() {
  this.features_ = null;
  this.replayGroups_ = {};
  this.state = ol.TileState.ABORT;
  this.changed();
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * Get the feature format assigned for reading this tile's features.
 * @return {ol.format.Feature} Feature format.
 * @api
 */
ol.VectorTile.prototype.getFormat = function() {
  return this.format_;
};


/**
 * Get the features for this tile. Geometries will be in the projection returned
 * by {@link #getProjection}.
 * @return {Array.<ol.Feature|ol.render.Feature>} Features.
 * @api
 */
ol.VectorTile.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.getKey = function() {
  return this.url_;
};


/**
 * Get the feature projection of features returned by {@link #getFeatures}.
 * @return {ol.proj.Projection} Feature projection.
 * @api
 */
ol.VectorTile.prototype.getProjection = function() {
  return this.projection_;
};


ol.VectorTile.prototype.getReplayGroup = function(key) {
  return this.replayGroups_[key];
};


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.load = function() {
  if (this.state == ol.TileState.IDLE) {
    this.setState(ol.TileState.LOADING);
    this.tileLoadFunction_(this, this.url_);
    this.loader_(null, NaN, null);
  }
};


/**
 * Handler for successful tile load.
 * @param {Array.<ol.Feature>} features The loaded features.
 * @param {ol.proj.Projection} dataProjection Data projection.
 */
ol.VectorTile.prototype.onLoad_ = function(features, dataProjection) {
  this.setProjection(dataProjection);
  this.setFeatures(features);
};


/**
 * Handler for tile load errors.
 */
ol.VectorTile.prototype.onError_ = function() {
  this.setState(ol.TileState.ERROR);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @api
 */
ol.VectorTile.prototype.setFeatures = function(features) {
  this.features_ = features;
  this.setState(ol.TileState.LOADED);
};


/**
 * Set the projection of the features that were added with {@link #setFeatures}.
 * @param {ol.proj.Projection} projection Feature projection.
 * @api
 */
ol.VectorTile.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};


ol.VectorTile.prototype.setReplayGroup = function(key, replayGroup) {
  this.replayGroups_[key] = replayGroup;
};


/**
 * Set the feature loader for reading this tile's features.
 * @param {ol.FeatureLoader} loader Feature loader.
 * @api
 */
ol.VectorTile.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};
