goog.provide('ol.layer.XYZ');

goog.require('ol.Projection');
goog.require('ol.Tile');
goog.require('ol.TileSet');

/**
 * Class for XYZ layers.
 * @constructor
 * @param {string} url URL template. E.g.
 *     http://a.tile.openstreetmap.org/${z}/${x}/${y}.png.
 */
ol.layer.XYZ = function(url) {

    /**
     * @private
     * @type {string}
     */
    this.url_ = url;

    /**
     * @private
     * @type {number}
     */
    this.tileWidth_ = 256;

    /**
     * @private
     * @type {number}
     */
    this.tileHeight_ = 256;

    /**
     * @private
     * @type {number}
     */
    this.tileOriginX_ = -20037508.34;

    /**
     * @private
     * @type {number}
     */
    this.tileOriginY_ = 20037508.34;

    /**
     * @private
     * @type {ol.Projection}
     */
    this.projection_ = new ol.Projection('EPSG:900913');

    /**
     * @private
     * @type {Array.<number>}
     */
    this.resolutions_ = [
        156543.03390625, 78271.516953125, 39135.7584765625,
        19567.87923828125, 9783.939619140625, 4891.9698095703125,
        2445.9849047851562, 1222.9924523925781, 611.4962261962891,
        305.74811309814453, 152.87405654907226, 76.43702827453613,
        38.218514137268066, 19.109257068634033, 9.554628534317017,
        4.777314267158508, 2.388657133579254, 1.194328566789627,
        0.5971642833948135, 0.29858214169740677, 0.14929107084870338,
        0.07464553542435169
    ];

};

/**
 * Set tile width and height.
 * @param {number} width
 * @param {number} height
 */
ol.layer.XYZ.prototype.setTileSize = function(width, height) {
    this.tileWidth_ = width;
    this.tileHeight_ = height;
};

/**
 * Set the layer max extent.
 * @param {ol.Bounds} maxExtent
 */
ol.layer.XYZ.prototype.setMaxExtent = function(maxExtent) {
    this.maxExtent_ = maxExtent;
};

/**
 * Set tile origin.
 * @param {number} tileOriginX
 * @param {number} tileOriginY
 */
ol.layer.XYZ.prototype.setTileOrigin = function(tileOriginX, tileOriginY) {
    this.tileOriginX_ = tileOriginX;
    this.tileOriginY_ = tileOriginY;
};

/**
 * Set resolutions for the layer.
 * @param {Array.<number>} resolutions
 */
ol.layer.XYZ.prototype.setResolutions = function(resolutions) {
    this.resolutions_ = resolutions;
};

/**
 * Get data from the layer. This is the layer's main API function.
 * @param {ol.Bounds} bounds
 * @param {number} resolution
 */
ol.layer.XYZ.prototype.getData = function(bounds, resolution) {
    var me = this,
        zoom = me.zoomForResolution(resolution);
    resolution = me.resolutions_[zoom];

    var boundsMinX = bounds.getMinX(),
        boundsMaxX = bounds.getMaxX(),
        boundsMinY = bounds.getMinY(),
        boundsMaxY = bounds.getMaxY(),

        tileWidth = me.tileWidth_,
        tileHeight = me.tileHeight_,

        tileOriginX = me.tileOriginX_,
        tileOriginY = me.tileOriginY_,

        tileWidthGeo = tileWidth * resolution,
        tileHeightGeo = tileHeight * resolution,

        offsetX = Math.floor(
                      (boundsMinX - tileOriginX) / tileWidthGeo),
        offsetY = Math.floor(
                      (tileOriginY - boundsMaxY) / tileHeightGeo),

        gridLeft = tileOriginX + tileWidthGeo * offsetX,
        gridTop = tileOriginY - tileHeightGeo * offsetY;

    var tiles = [], tile, url, i = 0, j;
    while (gridTop - (i * tileHeightGeo) > boundsMinY) {
        tiles[i] = [];
        j = 0;
        while (gridLeft + (j * tileWidthGeo) < boundsMaxX) {
            url = me.url_.replace('{x}', offsetX + i + '')
                         .replace('{y}', offsetY + j + '')
                         .replace('{z}', zoom);
            tile = new ol.Tile(url);
            tiles[i][j] = tile;
            j++;
        }
        i++;
    }

    return new ol.TileSet(tiles, tileWidth, tileHeight, resolution);
};

/**
 * Get the zoom level (z) for the given resolution.
 * @param {number} resolution
 */
ol.layer.XYZ.prototype.zoomForResolution = function(resolution) {
    var delta = Number.POSITIVE_INFINITY,
        currentDelta,
        resolutions = this.resolutions_;
    for (var i=resolutions.length-1; i>=0; --i) {
        currentDelta = Math.abs(resolutions[i] - resolution);
        if (currentDelta > delta) {
            break;
        }
        delta = currentDelta;
    }
    return i + 1;
};
