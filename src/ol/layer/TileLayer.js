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
     * @type {function(new:ol.Tile, string, ol.Bounds)}
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
    this.tileOriginCorner_ = 'bl';

    /**
     * @private
     * @type {number|undefined}
     */
    this.maxResolution_ = undefined;

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
 * Get layer resolutions. Return null if the layer has no resolutions.
 * @return {Array.<number>}
 */
ol.layer.TileLayer.prototype.getResolutions = function() {
    if (goog.isNull(this.resolutions_) && goog.isDef(this.maxResolution_)) {
        this.resolutions_ = [];
        for (var i = 0; i < this.numZoomLevels_; i++) {
            this.resolutions_[i] = this.maxResolution_ / Math.pow(2, i);
        }
    }
    return this.resolutions_;
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
 * Set tile width and height.
 * @param {number} width
 * @param {number} height
 */
ol.layer.TileLayer.prototype.setTileSize = function(width, height) {
    this.tileWidth_ = width;
    this.tileHeight_ = height;
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
