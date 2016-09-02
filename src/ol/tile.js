goog.provide('ol.Tile');

goog.require('ol');
goog.require('ol.events.EventTarget');
goog.require('ol.events.EventType');


/**
 * @classdesc
 * Base class for tiles.
 *
 * @constructor
 * @extends {ol.events.EventTarget}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Tile.State} state State.
 */
ol.Tile = function(tileCoord, state) {

  ol.events.EventTarget.call(this);

  /**
   * @type {ol.TileCoord}
   */
  this.tileCoord = tileCoord;

  /**
   * @protected
   * @type {ol.Tile.State}
   */
  this.state = state;

  /**
   * An "interim" tile for this tile. The interim tile may be used while this
   * one is loading, for "smooth" transitions when changing params/dimensions
   * on the source.
   * @type {ol.Tile}
   */
  this.interimTile = null;

  /**
   * A key assigned to the tile. This is used by the tile source to determine
   * if this tile can effectively be used, or if a new tile should be created
   * and this one be used as an interim tile for this new tile.
   * @type {string}
   */
  this.key = '';

};
ol.inherits(ol.Tile, ol.events.EventTarget);


/**
 * @protected
 */
ol.Tile.prototype.changed = function() {
  this.dispatchEvent(ol.events.EventType.CHANGE);
};


/**
 * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
 * @abstract
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
 */
ol.Tile.prototype.getImage = function(opt_context) {};


/**
 * @return {string} Key.
 */
ol.Tile.prototype.getKey = function() {
  return this.key + '/' + this.tileCoord;
};


/**
 * Get the tile coordinate for this tile.
 * @return {ol.TileCoord} The tile coordinate.
 * @api
 */
ol.Tile.prototype.getTileCoord = function() {
  return this.tileCoord;
};


/**
 * @return {ol.Tile.State} State.
 */
ol.Tile.prototype.getState = function() {
  return this.state;
};


/**
 * Load the image or retry if loading previously failed.
 * Loading is taken care of by the tile queue, and calling this method is
 * only needed for preloading or for reloading in case of an error.
 * @abstract
 * @api
 */
ol.Tile.prototype.load = function() {};


/**
 * @enum {number}
 */
ol.Tile.State = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
  EMPTY: 4,
  ABORT: 5
};
