goog.provide('ol.TileSet');

/**
 * The TileSet class. A TileSet instance represents a collection of
 * tiles. Tiles of a TileSet have the same resolution, width and
 * height.
 * @constructor
 * @param {Array.<Array.<ol.Tile>>} tiles
 * @param {number} tileWidth
 * @param {number} tileHeight
 * @param {number} resolution
 */
ol.TileSet = function(tiles, tileWidth, tileHeight, resolution) {

    /**
     * @private
     * @type {Array.<Array.<ol.Tile>>}
     */
    this.tiles_ = tiles;

    /**
     * @private
     * @type {number}
     */
    this.tileWidth_ = tileWidth;

    /**
     * @private
     * @type {number}
     */
    this.tileHeight_ = tileHeight;

    /**
     * @private
     * @type {number}
     */
    this.resolution_ = resolution;
};

/**
 * @return {Array.<Array.<ol.Tile>>}
 */
ol.TileSet.prototype.getTiles = function() {
    return this.tiles_;
};

/**
 * @return {number}
 */
ol.TileSet.prototype.getResolution = function() {
    return this.resolution_;
};

/**
 * @return {number}
 */
ol.TileSet.prototype.getTileHeight = function() {
    return this.tileHeight_;
};

/**
 * @return {number}
 */
ol.TileSet.prototype.getTileWidth = function() {
    return this.tileWidth_;
};
