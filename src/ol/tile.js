goog.provide('ol.Tile');
goog.provide('ol.TileState');

goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.events.EventType');
goog.require('ol.TileCoord');


/**
 * @enum {number}
 */
ol.TileState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3,
  EMPTY: 4
};


/**
 * @classdesc
 * Base class for tiles.
 *
 * @constructor
 * @extends {ol.events.EventTarget}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 */
ol.Tile = function(tileCoord, state) {

  goog.base(this);

  /**
   * @type {ol.TileCoord}
   */
  this.tileCoord = tileCoord;

  /**
   * @protected
   * @type {ol.TileState}
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
goog.inherits(ol.Tile, ol.events.EventTarget);


/**
 * @protected
 */
ol.Tile.prototype.changed = function() {
  this.dispatchEvent(ol.events.EventType.CHANGE);
};


/**
 * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
 * @function
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
 */
ol.Tile.prototype.getImage = goog.abstractMethod;


/**
 * @return {string} Key.
 */
ol.Tile.prototype.getKey = function() {
  return goog.getUid(this).toString();
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
 * @return {ol.TileState} State.
 */
ol.Tile.prototype.getState = function() {
  return this.state;
};


/**
 * FIXME empty description for jsdoc
 */
ol.Tile.prototype.load = goog.abstractMethod;
