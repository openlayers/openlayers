goog.provide('ol.Tile');
goog.provide('ol.TileState');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.TileCoord');


/**
 * @enum {number}
 */
ol.TileState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 */
ol.Tile = function(tileCoord) {

  goog.base(this);

  /**
   * A count incremented each time the tile is inQueue in a tile queue,
   * and decremented each time the tile is dequeued from a tile queue.
   * @type {number}
   */
  this.inQueue = 0;

  /**
   * @type {ol.TileCoord}
   */
  this.tileCoord = tileCoord;

  /**
   * @protected
   * @type {ol.TileState}
   */
  this.state = ol.TileState.IDLE;

};
goog.inherits(ol.Tile, goog.events.EventTarget);


/**
 * @protected
 */
ol.Tile.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
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
 * @return {ol.TileState} State.
 */
ol.Tile.prototype.getState = function() {
  return this.state;
};


/**
 * FIXME empty description for jsdoc
 */
ol.Tile.prototype.load = goog.abstractMethod;
