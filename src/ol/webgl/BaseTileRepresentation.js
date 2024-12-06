/**
 * @module ol/webgl/BaseTileRepresentation
 */

import ImageTile from '../ImageTile.js';
import TileState from '../TileState.js';
import EventType from '../events/EventType.js';
import EventTarget from '../events/Target.js';
import {abstract} from '../util.js';

/**
 * @typedef {import("../Tile.js").default} BaseTileType
 */

/**
 * @template {BaseTileType} TileType
 * @typedef {Object} TileRepresentationOptions
 * @property {TileType} tile The tile.
 * @property {import("../tilegrid/TileGrid.js").default} grid Tile grid.
 * @property {import("../webgl/Helper.js").default} helper WebGL helper.
 * @property {number} [gutter=0] The size in pixels of the gutter around image tiles to ignore.
 */

/**
 * @classdesc
 * Base class for representing a tile in a webgl context
 * @template {import("../Tile.js").default} TileType
 * @abstract
 */
class BaseTileRepresentation extends EventTarget {
  /**
   * @param {TileRepresentationOptions<TileType>} options The tile representation options.
   */
  constructor(options) {
    super();

    /**
     * @type {TileType}
     */
    this.tile;

    /**
     * @private
     */
    this.handleTileChange_ = this.handleTileChange_.bind(this);

    /**
     * @type {number}
     * @protected
     */
    this.gutter = options.gutter || 0;

    /**
     * @type {import("../webgl/Helper.js").default}
     * @protected
     */
    this.helper = options.helper;

    this.loaded = false;
    this.ready = false;
  }

  /**
   * @param {TileType} tile Tile.
   */
  setTile(tile) {
    if (tile !== this.tile) {
      if (this.tile) {
        this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
      }
      this.tile = tile;
      this.loaded = tile.getState() === TileState.LOADED;
      if (this.loaded) {
        this.uploadTile();
      } else {
        if (tile instanceof ImageTile) {
          const image = tile.getImage();
          if (image instanceof Image && !image.crossOrigin) {
            image.crossOrigin = 'anonymous';
          }
        }
        tile.addEventListener(EventType.CHANGE, this.handleTileChange_);
      }
    }
  }

  /**
   * @abstract
   * @protected
   */
  uploadTile() {
    abstract();
  }

  setReady() {
    this.ready = true;
    this.dispatchEvent(EventType.CHANGE);
  }

  handleTileChange_() {
    if (this.tile.getState() === TileState.LOADED) {
      this.loaded = true;
      this.uploadTile();
    }
  }

  /**
   * @param {import("./Helper.js").default} helper The WebGL helper.
   */
  setHelper(helper) {
    this.helper = helper;
    if (this.helper && this.loaded) {
      this.uploadTile();
    }
  }

  /**
   * @override
   */
  disposeInternal() {
    this.setHelper(null);
    this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
  }
}

export default BaseTileRepresentation;
