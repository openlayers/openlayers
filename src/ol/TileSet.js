goog.provide('ol.TileSet');

/**
 * The TileSet class. A TileSet instance represents a collection of
 * tiles. Tiles of a TileSet have the same resolution, width and
 * height.
 * @constructor
 * @params {Array.<Array.<ol.Tile>>} tiles
 * @params {number} tileWidth
 * @params {number} tileHeight
 * @params {number} resolution
 */
ol.TileSet = function(tiles, tileWidth, tileHeight, resolution) {

    /**
     * @private
     * @type {Array.<Array.<ol.Tile>>}
     */
    this.tiles_ = tiles;

    /**
     * @private
     * @type {number|undefined}
     */
    this.tileWidth_ = tileWidth;

    /**
     * @private
     * @type {number|undefined}
     */
    this.tileHeight_ = tileHeight;

    /**
     * @private
     * @type {number|undefined}
     */
    this.resolution_ = resolution;
};

ol.TileSet.prototype.getTiles = function() {
    return this.tiles_;
};
