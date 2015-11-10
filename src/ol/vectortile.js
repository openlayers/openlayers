goog.provide('ol.VectorTile');

goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');


/**
 * @typedef {{
 *     dirty: boolean,
 *     renderedRenderOrder: (null|function(ol.Feature, ol.Feature):number),
 *     renderedRevision: number,
 *     replayGroup: ol.render.IReplayGroup}}
 */
ol.TileReplayState;



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

  goog.base(this, tileCoord, state);

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
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_ = null;

  /**
   * @private
   * @type {ol.TileReplayState}
   */
  this.replayState_ = {
    dirty: false,
    renderedRenderOrder: null,
    renderedRevision: -1,
    replayGroup: null
  };

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
goog.inherits(ol.VectorTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
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
 * @return {Array.<ol.Feature>} Features.
 */
ol.VectorTile.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @return {ol.TileReplayState}
 */
ol.VectorTile.prototype.getReplayState = function() {
  return this.replayState_;
};


/**
 * @inheritDoc
 */
ol.VectorTile.prototype.getKey = function() {
  return this.url_;
};


/**
 * @return {ol.proj.Projection} Projection.
 */
ol.VectorTile.prototype.getProjection = function() {
  return this.projection_;
};


/**
 * Load the tile.
 */
ol.VectorTile.prototype.load = function() {
  if (this.state == ol.TileState.IDLE) {
    this.setState(ol.TileState.LOADING);
    this.tileLoadFunction_(this, this.url_);
    this.loader_(null, NaN, null);
  }
};


/**
 * @param {Array.<ol.Feature>} features Features.
 */
ol.VectorTile.prototype.setFeatures = function(features) {
  this.features_ = features;
  this.setState(ol.TileState.LOADED);
};


/**
 * @param {ol.proj.Projection} projection Projection.
 */
ol.VectorTile.prototype.setProjection = function(projection) {
  this.projection_ = projection;
};


/**
 * @param {ol.TileState} tileState Tile state.
 */
ol.VectorTile.prototype.setState = function(tileState) {
  this.state = tileState;
  this.changed();
};


/**
 * Set the feature loader for reading this tile's features.
 * @param {ol.FeatureLoader} loader Feature loader.
 * @api
 */
ol.VectorTile.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};
