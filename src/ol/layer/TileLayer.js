goog.provide('ol.layer.TileLayer');

goog.require('ol.layer.Layer');
goog.require('ol.Tile');
goog.require('ol.TileCache');

/**
 * @constructor
 * @extends {ol.layer.Layer}
 */
ol.layer.TileLayer = function() {

    /**
     * @private
     * @type {string|undefined}
     */
    this.url_ = undefined;

    /**
     * @protected
     * @type {ol.Projection}
     */
    this.projection_ = null;

    /**
     * @private
     * @type {ol.Bounds}
     */
    this.extent_ = null;

    /**
     * @protected
     * @type {number}
     */
    this.tileWidth_ = 256;

    /**
     * @protected
     * @type {number}
     */
    this.tileHeight_ = 256;

    /**
     * @protected
     * @type {function(new:ol.Tile, string, ol.Bounds=)}
     */
    this.Tile = ol.Tile.createConstructor(this.tileWidth_, this.tileHeight_);

    /**
     * @protected
     * @type {number|undefined}
     */
    this.tileOriginX_ = undefined;

    /**
     * @protected
     * @type {number|undefined}
     */
    this.tileOriginY_ = undefined;

    /**
     * @private
     * @type {string}
     */
    this.tileOriginCorner_ = 'tl';

    /**
     * @private
     * @type {number|undefined}
     */
    this.maxResolution_ = undefined;

    /**
     * @private
     * @type {boolean}
     */
    this.xRight_ = true;

    /**
     * @private
     * @type {boolean}
     */
    this.yDown_ = true;

    /**
     * @private
     * @type {number|undefined}
     */
    this.numZoomLevels_ = undefined;

    /**
     * @protected
     * @type {Array.<number>}
     */
    this.resolutions_ = null;

    /**
     * @private
     * @type {ol.TileCache}
     */
    this.cache_ = new ol.TileCache();

};

goog.inherits(ol.layer.TileLayer, ol.layer.Layer);

/**
 * @protected
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {string}
 */
ol.layer.TileLayer.prototype.getTileUrl = function(x, y, z) {
    // overridden by subclasses
};

/**
 * @return {string|undefined} The layer URL.
 */
ol.layer.TileLayer.prototype.getUrl = function() {
    return this.url_;
};

/**
 * @return {boolean} The tile index increases from left to right.
 */
ol.layer.TileLayer.prototype.getXRight = function() {
    return this.xRight_;
};

/**
 * @return {boolean} The tile index increases from top to bottom.
 */
ol.layer.TileLayer.prototype.getYDown = function() {
    return this.yDown_;
};

/**
 * @param {boolean} right The tile index increases from left to right.
 */
ol.layer.TileLayer.prototype.setXRight = function(right) {
    this.xRight_ = right;
};

/**
 * @param {boolean} down The tile index increases from top to bottom.
 */
ol.layer.TileLayer.prototype.setYDown = function(down) {
    this.yDown_ = down;
};

/**
 * Get layer extent. Return null if the layer has no extent
 * and no projection.
 * @return {ol.UnreferencedBounds}
 */
ol.layer.TileLayer.prototype.getExtent = function() {
    if (!goog.isNull(this.extent_)) {
        return this.extent_;
    }
    if (!goog.isNull(this.projection_)) {
        return this.projection_.getExtent();
    }
    return null;
};

/**
 * Get tile size.
 * @return {Array.<number>}
 */
ol.layer.TileLayer.prototype.getTileSize = function() {
    return [this.tileWidth_, this.tileHeight_];
};

/**
 * Get tile origin.
 * @return {Array.<number>}
 */
ol.layer.TileLayer.prototype.getTileOrigin = function() {
    if (goog.isDef(this.tileOriginX_) &&
        goog.isDef(this.tileOriginY_)) {
        return [this.tileOriginX_, this.tileOriginY_];
    }
    var errmsg;
    if (goog.isDef(this.tileOriginCorner_)) {
        var extent = this.getExtent();
        if (!goog.isNull(extent)) {
            var tileOriginX, tileOriginY;
            switch (this.tileOriginCorner_) {
                case "tl":
                    tileOriginX = extent.getMinX();
                    tileOriginY = extent.getMaxY();
                    break;
                case "tr":
                    tileOriginX = extent.getMaxX();
                    tileOriginY = extent.getMaxY();
                    break;
                case "bl":
                    tileOriginX = extent.getMinX();
                    tileOriginY = extent.getMinY();
                    break;
                case "br":
                    tileOriginX = extent.getMaxX();
                    tileOriginY = extent.getMinY();
                    break;
                default:
                    // FIXME user error
                    goog.asserts.assert(false);
            }
            return [tileOriginX, tileOriginY];
        }
        // FIXME user error
        goog.asserts.assert(false);
    }
    // FIXME user error
    goog.asserts.assert(false);
    return null;
};

/**
 * Get max resolution. Return undefined if the layer has no maxResolution,
 * and no extent from which maxResolution could be derived.
 * @return {number|undefined}
 */
ol.layer.TileLayer.prototype.getMaxResolution = function() {
    if (!goog.isDef(this.maxResolution_)) {
        var extent = this.getExtent();
        if (!goog.isNull(extent)) {
            this.maxResolution_ = Math.max(
                (extent.getMaxX() - extent.getMinX()) / this.tileWidth_,
                (extent.getMaxY() - extent.getMinY()) / this.tileHeight_);
        }
    }
    return this.maxResolution_;
};

/**
 * Get the number of the zoom levels.
 * @return {number|undefined}
 */
ol.layer.TileLayer.prototype.getNumZoomLevels = function() {
    return this.numZoomLevels_;
};

/**
 * Get layer resolutions. Return null if the layer has no resolutions.
 * @return {Array.<number>}
 */
ol.layer.TileLayer.prototype.getResolutions = function() {
    if (goog.isNull(this.resolutions_)) {
        var maxResolution = this.getMaxResolution(),
            numZoomLevels = this.getNumZoomLevels();
        if (goog.isDef(maxResolution) && goog.isDef(numZoomLevels)) {
            this.resolutions_ = [];
            for (var i = 0; i < numZoomLevels; i++) {
                this.resolutions_[i] = maxResolution / Math.pow(2, i);
            }
        }
    }
    return this.resolutions_;
};

/**
 * Set the layer URL.
 * @param {string} url
 */
ol.layer.TileLayer.prototype.setUrl = function(url) {
    this.url_ = url;
};

/**
 * Set layer projection.
 * @param {ol.Projection} projection
 */
ol.layer.TileLayer.prototype.setProjection = function(projection) {
    this.projection_ = projection;
};

/**
 * Set layer extent.
 * @param {ol.Bounds} extent
 */
ol.layer.TileLayer.prototype.setExtent = function(extent) {
    this.extent_ = extent;
};

/**
 * Set tile origin.
 * @param {number} tileOriginX
 * @param {number} tileOriginY
 */
ol.layer.TileLayer.prototype.setTileOrigin = function(tileOriginX, tileOriginY) {
    this.tileOriginX_ = tileOriginX;
    this.tileOriginY_ = tileOriginY;
};

/**
 * Set tile origin corner.
 * @param {string} tileOriginCorner
 */
ol.layer.TileLayer.prototype.setTileOriginCorner = function(tileOriginCorner) {
    this.tileOriginCorner_ = tileOriginCorner;
};

/**
 * Set maximum resolution.
 * @param {number} maxResolution
 */
ol.layer.TileLayer.prototype.setMaxResolution = function(maxResolution) {
    this.maxResolution_ = maxResolution;
};

/**
 * Set the number of zoom levels.
 * @param {number} numZoomLevels
 */
ol.layer.TileLayer.prototype.setNumZoomLevels = function(numZoomLevels) {
    this.numZoomLevels_ = numZoomLevels;
};

/**
 * Set resolutions for the layer.
 * @param {Array.<number>} resolutions
 */
ol.layer.TileLayer.prototype.setResolutions = function(resolutions) {
    this.resolutions_ = resolutions;
};

/**
 * Get a tile from the cache, or create a tile and add to
 * the cache.
 * @param url {string}
 * @param bounds {ol.Bounds}
 */
ol.layer.TileLayer.prototype.getTile = function(url, bounds) {
    var tile = this.cache_.get(url);
    if (!goog.isDef(tile)) {
        tile = new this.Tile(url, bounds);
        this.cache_.set(tile.getUrl(), tile);
    }
    return tile;
};

/**
 * Get a tile from the cache, or create a tile and add to
 * the cache.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
ol.layer.TileLayer.prototype.getTileForXYZ = function(x, y, z) {
    var tileUrl = this.getTileUrl(x, y, z);
    var tile = this.cache_.get(tileUrl);
    if (!goog.isDef(tile)) {
        tile = new this.Tile(tileUrl);
        this.cache_.set(tileUrl, tile);
    }
    return tile;
};

/**
 * Get data from the layer. This is the layer's main API function.
 * @param {ol.Bounds} bounds
 * @param {number} resolution
 */
ol.layer.TileLayer.prototype.getData = function(bounds, resolution) {
    var me = this,
        zoomAndRes = me.getZoomAndRes(resolution),
        zoom = zoomAndRes[0];
    resolution = zoomAndRes[1];

    // define some values used for the actual tiling
    var boundsMinX = bounds.getMinX(),
        boundsMaxX = bounds.getMaxX(),
        boundsMinY = bounds.getMinY(),
        boundsMaxY = bounds.getMaxY(),
        tileWidth = me.tileWidth_,
        tileHeight = me.tileHeight_,
        tileOrigin = me.getTileOrigin(),
        tileOriginX = tileOrigin[0],
        tileOriginY = tileOrigin[1],
        tileWidthGeo = tileWidth * resolution,
        tileHeightGeo = tileHeight * resolution;

    // make sure we don't create tiles outside the layer extent
    var extent = this.getExtent();
    if (extent) {
        boundsMinX = Math.max(boundsMinX, extent.getMinX());
        boundsMaxX = Math.min(boundsMaxX, extent.getMaxX());
        boundsMinY = Math.max(boundsMinY, extent.getMinY());
        boundsMaxY = Math.min(boundsMaxY, extent.getMaxY());
    }

    var offsetX = Math.floor(
                      (boundsMinX - tileOriginX) / tileWidthGeo),
        offsetY = Math.floor(
                      (tileOriginY - boundsMaxY) / tileHeightGeo),
        gridLeft = tileOriginX + tileWidthGeo * offsetX,
        gridTop = tileOriginY - tileHeightGeo * offsetY;

    // now tile
    var tiles = [],
        tile,
        url,
        tileBottom, tileRight, tileBounds;
    for (var y=0, tileTop=gridTop; tileTop > boundsMinY;
             ++y, tileTop-=tileHeightGeo) {
        tiles[y] = [];
        tileBottom = tileTop - tileHeightGeo;
        for (var x=0, tileLeft=gridLeft; tileLeft < boundsMaxX;
                 ++x, tileLeft+=tileWidthGeo) {
            tileRight = tileLeft + tileWidthGeo;
            tileBounds = new ol.Bounds(tileLeft, tileBottom,
                                       tileRight, tileTop, this.projection_);
            url = this.getTileUrl(offsetX + x, offsetY + y, zoom);
            tile = this.getTile(url, tileBounds);
            tiles[y][x] = tile;
        }
    }

    return new ol.TileSet(tiles, tileWidth, tileHeight, resolution);
};

/**
 * Get the zoom level (z) and layer resolution for the given resolution.
 * @param {number} resolution
 * @return {Array.<number>}
 */
ol.layer.TileLayer.prototype.getZoomAndRes = function(resolution) {
    var delta = Number.POSITIVE_INFINITY,
        currentDelta,
        resolutions = this.getResolutions(),
        zoom;
    for (var i=resolutions.length-1; i>=0; --i) {
        currentDelta = Math.abs(resolutions[i] - resolution);
        if (currentDelta > delta) {
            break;
        }
        delta = currentDelta;
    }
    zoom = i + 1;
    return [zoom, resolutions[zoom]];
};
