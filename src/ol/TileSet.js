goog.provide('ol.TileSet');

/**
 * The TileSet class. A TileSet instance represents a collection of
 * tiles. Tiles of a TileSet have the same resolution, width and
 * height.
 * @constructor
 */
ol.TileSet = function() {

    /**
     * @private
     * @type {number|undefined}
     */
    this.resolution_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.bounds_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.tileWidth_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.tileHeight_ = undefined;

    /**
     * @private
     * @type {Array.<ol.Tile>|undefined}
     */
    this.tiles_ = undefined;
};
