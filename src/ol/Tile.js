/**
 * @module ol/Tile
 */
import EventTarget from './events/Target.js';
import EventType from './events/EventType.js';
import TileState from './TileState.js';
import {abstract} from './util.js';
import {easeIn} from './easing.js';

/**
 * A function that takes an {@link module:ol/Tile} for the tile and a
 * `{string}` for the url as arguments. The default is
 * ```js
 * source.setTileLoadFunction(function(tile, src) {
 *   tile.getImage().src = src;
 * });
 * ```
 * For more fine grained control, the load function can use fetch or XMLHttpRequest and involve
 * error handling:
 *
 * ```js
 * import TileState from 'ol/TileState';
 *
 * source.setTileLoadFunction(function(tile, src) {
 *   var xhr = new XMLHttpRequest();
 *   xhr.responseType = 'blob';
 *   xhr.addEventListener('loadend', function (evt) {
 *     var data = this.response;
 *     if (data !== undefined) {
 *       tile.getImage().src = URL.createObjectURL(data);
 *     } else {
 *       tile.setState(TileState.ERROR);
 *     }
 *   });
 *   xhr.addEventListener('error', function () {
 *     tile.setState(TileState.ERROR);
 *   });
 *   xhr.open('GET', src);
 *   xhr.send();
 * });
 * ```
 *
 * @typedef {function(Tile, string): void} LoadFunction
 * @api
 */

/**
 * {@link module:ol/source/Tile~Tile} sources use a function of this type to get
 * the url that provides a tile for a given tile coordinate.
 *
 * This function takes an {@link module:ol/tilecoord~TileCoord} for the tile
 * coordinate, a `{number}` representing the pixel ratio and a
 * {@link module:ol/proj/Projection} for the projection  as arguments
 * and returns a `{string}` representing the tile URL, or undefined if no tile
 * should be requested for the passed tile coordinate.
 *
 * @typedef {function(import("./tilecoord.js").TileCoord, number,
 *           import("./proj/Projection.js").default): (string|undefined)} UrlFunction
 * @api
 */

/**
 * @typedef {Object} Options
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @api
 */

/**
 * @classdesc
 * Base class for tiles.
 *
 * @abstract
 */
class Tile extends EventTarget {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {Options} [opt_options] Tile options.
   */
  constructor(tileCoord, state, opt_options) {
    super();

    const options = opt_options ? opt_options : {};

    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    this.tileCoord = tileCoord;

    /**
     * @protected
     * @type {import("./TileState.js").default}
     */
    this.state = state;

    /**
     * An "interim" tile for this tile. The interim tile may be used while this
     * one is loading, for "smooth" transitions when changing params/dimensions
     * on the source.
     * @type {Tile}
     */
    this.interimTile = null;

    /**
     * A key assigned to the tile. This is used by the tile source to determine
     * if this tile can effectively be used, or if a new tile should be created
     * and this one be used as an interim tile for this new tile.
     * @type {string}
     */
    this.key = '';

    /**
     * The duration for the opacity transition.
     * @type {number}
     */
    this.transition_ =
      options.transition === undefined ? 250 : options.transition;

    /**
     * Lookup of start times for rendering transitions.  If the start time is
     * equal to -1, the transition is complete.
     * @type {Object<string, number>}
     */
    this.transitionStarts_ = {};
  }

  /**
   * @protected
   */
  changed() {
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * Called by the tile cache when the tile is removed from the cache due to expiry
   */
  release() {}

  /**
   * @return {string} Key.
   */
  getKey() {
    return this.key + '/' + this.tileCoord;
  }

  /**
   * Get the interim tile most suitable for rendering using the chain of interim
   * tiles. This corresponds to the  most recent tile that has been loaded, if no
   * such tile exists, the original tile is returned.
   * @return {!Tile} Best tile for rendering.
   */
  getInterimTile() {
    if (!this.interimTile) {
      //empty chain
      return this;
    }
    let tile = this.interimTile;

    // find the first loaded tile and return it. Since the chain is sorted in
    // decreasing order of creation time, there is no need to search the remainder
    // of the list (all those tiles correspond to older requests and will be
    // cleaned up by refreshInterimChain)
    do {
      if (tile.getState() == TileState.LOADED) {
        // Show tile immediately instead of fading it in after loading, because
        // the interim tile is in place already
        this.transition_ = 0;
        return tile;
      }
      tile = tile.interimTile;
    } while (tile);

    // we can not find a better tile
    return this;
  }

  /**
   * Goes through the chain of interim tiles and discards sections of the chain
   * that are no longer relevant.
   */
  refreshInterimChain() {
    if (!this.interimTile) {
      return;
    }

    let tile = this.interimTile;
    let prev = /** @type {Tile} */ (this);

    do {
      if (tile.getState() == TileState.LOADED) {
        //we have a loaded tile, we can discard the rest of the list
        //we would could abort any LOADING tile request
        //older than this tile (i.e. any LOADING tile following this entry in the chain)
        tile.interimTile = null;
        break;
      } else if (tile.getState() == TileState.LOADING) {
        //keep this LOADING tile any loaded tiles later in the chain are
        //older than this tile, so we're still interested in the request
        prev = tile;
      } else if (tile.getState() == TileState.IDLE) {
        //the head of the list is the most current tile, we don't need
        //to start any other requests for this chain
        prev.interimTile = tile.interimTile;
      } else {
        prev = tile;
      }
      tile = prev.interimTile;
    } while (tile);
  }

  /**
   * Get the tile coordinate for this tile.
   * @return {import("./tilecoord.js").TileCoord} The tile coordinate.
   * @api
   */
  getTileCoord() {
    return this.tileCoord;
  }

  /**
   * @return {import("./TileState.js").default} State.
   */
  getState() {
    return this.state;
  }

  /**
   * Sets the state of this tile. If you write your own {@link module:ol/Tile~LoadFunction tileLoadFunction} ,
   * it is important to set the state correctly to {@link module:ol/TileState~ERROR}
   * when the tile cannot be loaded. Otherwise the tile cannot be removed from
   * the tile queue and will block other requests.
   * @param {import("./TileState.js").default} state State.
   * @api
   */
  setState(state) {
    if (this.state !== TileState.ERROR && this.state > state) {
      throw new Error('Tile load sequence violation');
    }
    this.state = state;
    this.changed();
  }

  /**
   * Load the image or retry if loading previously failed.
   * Loading is taken care of by the tile queue, and calling this method is
   * only needed for preloading or for reloading in case of an error.
   * @abstract
   * @api
   */
  load() {
    abstract();
  }

  /**
   * Get the alpha value for rendering.
   * @param {string} id An id for the renderer.
   * @param {number} time The render frame time.
   * @return {number} A number between 0 and 1.
   */
  getAlpha(id, time) {
    if (!this.transition_) {
      return 1;
    }

    let start = this.transitionStarts_[id];
    if (!start) {
      start = time;
      this.transitionStarts_[id] = start;
    } else if (start === -1) {
      return 1;
    }

    const delta = time - start + 1000 / 60; // avoid rendering at 0
    if (delta >= this.transition_) {
      return 1;
    }
    return easeIn(delta / this.transition_);
  }

  /**
   * Determine if a tile is in an alpha transition.  A tile is considered in
   * transition if tile.getAlpha() has not yet been called or has been called
   * and returned 1.
   * @param {string} id An id for the renderer.
   * @return {boolean} The tile is in transition.
   */
  inTransition(id) {
    if (!this.transition_) {
      return false;
    }
    return this.transitionStarts_[id] !== -1;
  }

  /**
   * Mark a transition as complete.
   * @param {string} id An id for the renderer.
   */
  endTransition(id) {
    if (this.transition_) {
      this.transitionStarts_[id] = -1;
    }
  }
}

export default Tile;
