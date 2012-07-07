goog.provide('ol.renderer.TileLayerRenderer');

goog.require('ol.renderer.LayerRenderer');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Composite');
goog.require('ol.TileSet');
goog.require('ol.Bounds');

goog.require('goog.style');


/**
 * A single layer renderer that will be created by the composite map renderer.
 *
 * @constructor
 * @param {!Element} container
 * @param {!ol.layer.Layer} layer
 * @extends {ol.renderer.LayerRenderer}
 */
ol.renderer.TileLayerRenderer = function(container, layer) {
    
    goog.base(this, container, layer);

    /**
     * @type {Array.<number>}
     */
    this.layerResolutions_ = layer.getResolutions();

    /**
     * @type {Array.<number>}
     */
    this.tileOrigin_ = layer.getTileOrigin();

    /**
     * @type {Array.<number>}
     */
    this.tileSize_ = layer.getTileSize();

    /**
     * @type {boolean}
     */
    this.xRight_ = layer.getXRight();

    /**
     * @type {boolean}
     */
    this.yDown_ = layer.getYDown();

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedResolution_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedTop_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedRight_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedBottom_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedLeft_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedZ_ = undefined;
    
    /**
     * @type {goog.math.Size}
     * @private
     */
    this.containerSize_ = null;
    
};

goog.inherits(ol.renderer.TileLayerRenderer, ol.renderer.LayerRenderer);

/**
 * @param {number} resolution
 * @return {Array.<number>}
 */
ol.renderer.TileLayerRenderer.prototype.getPreferredResAndZ_ = function(resolution) {
    var minDiff = Number.POSITIVE_INFINITY;
    var candidate, diff, z, r;
    for (var i=0, ii=this.layerResolutions_.length; i<ii; ++i) {
        // assumes sorted resolutions
        candidate = this.layerResolutions_[i];
        diff = Math.abs(resolution - candidate);
        if (diff < minDiff) {
            z = i;
            r = candidate;
            minDiff = diff;
        } else {
            break;
        }
    }
    return [r, z];
};

/**
 * @return {goog.math.Size}
 */
ol.renderer.TileLayerRenderer.prototype.getContainerSize_ = function() {
    // TODO: listen for resize and set this.constainerSize_ null
    // https://github.com/openlayers/ol3/issues/2
    if (goog.isNull(this.containerSize_)) {
        this.containerSize_ = goog.style.getSize(this.container_);
    }
    return this.containerSize_;
};

/**
 * Tiles rendered at the current resolution;
 * @type {Object}
 */
ol.renderer.TileLayerRenderer.prototype.renderedTiles_ = {};

/**
 * Render the layer.
 *
 * @param {!ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.TileLayerRenderer.prototype.draw = function(center, resolution) {
    if (resolution !== this.renderedResolution_) {
        this.changeResolution_(center, resolution);
    }
    var pair = this.getPreferredResAndZ_(resolution);
    var tileResolution = pair[0];
    var tileZ = pair[1];
    var scale = resolution / tileResolution;
    
    var containerSize = this.getContainerSize_();
    var xRight = this.xRight_;
    var yDown = this.yDown_;

    var halfMapWidth = (resolution * containerSize.width) / 2;
    var halfMapHeight = (resolution * containerSize.height) / 2;
    var centerX = center.getX();
    var centerY = center.getY();

    // calculate vector from tile origin to map top-left (in integer pixel space)
    var tileOrigin = this.tileOrigin_;
    var mapOrigin = [centerX - halfMapWidth, centerY + halfMapHeight];
    var pxMap = [
        Math.round((mapOrigin[0] - tileOrigin[0]) / resolution),
        Math.round((tileOrigin[1] - mapOrigin[1]) / resolution)
    ];

    // desired tile size in fractional pixels
    var fpxTileWidth = this.tileSize_[0] / scale;
    var fpxTileHeight = this.tileSize_[1] / scale;
    
    // calculate vector from tile origin to top-left tile (in integer pixel space)
    var colsLeft = Math.floor(pxMap[0] / fpxTileWidth);
    var rowsAbove = Math.floor(pxMap[1] / fpxTileHeight);
    var pxTile = [Math.round(colsLeft * fpxTileWidth), Math.round(rowsAbove * fpxTileHeight)];
    
    // offset vector from container origin to top-left tile (in integer pixel space)
    var pxOffsetX = Math.round(pxTile[0] - pxMap[0] - this.containerOffset_.x);
    var pxOffsetY = Math.round(pxTile[1] - pxMap[1] - this.containerOffset_.y);
    
    // index of the top left tile
    var leftTileX = xRight ? colsLeft : (-colsLeft - 1);
    var topTileY = yDown ? rowsAbove : (-rowsAbove - 1);

    var numTilesWide = Math.ceil(containerSize.width / fpxTileWidth);
    var numTilesHigh = Math.ceil(containerSize.height / fpxTileHeight);
    if (this.containerOffset_.x !== -pxOffsetX) {
        numTilesWide += 1;
    }
    if (this.containerOffset_.y !== -pxOffsetY) {
        numTilesHigh += 1;
    }
    
    var pxMinX = pxOffsetX;
    var pxMinY = pxOffsetY;
    var pxTileLeft = pxMinX;

    var tileX, tileY, tile, img, pxTileBottom, pxTileRight, pxTileTop, xyz, append;
    var fragment = document.createDocumentFragment();
    var newTiles = false;
    for (var i=0; i<numTilesWide; ++i) {
        pxTileTop = pxMinY;
        tileX = xRight ? leftTileX + i : leftTileX - i;
        if (scale !== 1) {
            pxTileRight = Math.round(pxMinX + ((i+1) * fpxTileWidth));
        } else {
            pxTileRight = pxTileLeft + fpxTileWidth;
        }
        for (var j=0; j<numTilesHigh; ++j) {
            append = false;
            tileY = yDown ? topTileY + j : topTile - j;
            xyz = tileX + "," + tileY + "," + tileZ;
            if (scale !== 1) {
                pxTileBottom = Math.round(pxMinY + ((j+1) * fpxTileHeight));
            } else {
                pxTileBottom = pxTileTop + fpxTileHeight;
            }
            img = null;
            tile = this.renderedTiles_[xyz];
            if (!tile) {
                tile = this.layer_.getTileForXYZ(tileX, tileY, tileZ);
                if (tile) {
                    if (!tile.isLoaded() && !tile.isLoading()) {
                        tile.load();
                    }
                    this.renderedTiles_[xyz] = tile;
                    img = tile.getImg();
                    img.style.top = pxTileTop + "px";
                    img.style.left = pxTileLeft + "px";
                    if (scale !== 1) {
                        img.style.height = (pxTileRight - pxTileLeft) + "px";
                        img.style.width = (pxTileBottom - pxTileTop) + "px";
                    }
                    goog.dom.appendChild(fragment, img);
                    newTiles = true;
                }
            }
            pxTileTop = pxTileBottom;
        }
        pxTileLeft = pxTileRight;
    }
    if (newTiles) {
        this.container_.appendChild(fragment);
    }
    this.renderedResolution_ = resolution;
    this.renderedTop_ = topTileY;
    this.renderedRight_ = tileX;
    this.renderedBottom_ = tileY;
    this.renderedLeft_ = leftTileX;
    this.renderedZ_ = tileZ;
    this.removeInvisibleTiles_();
};



/**
 * Get rid of tiles outside the rendered extent.
 */
ol.renderer.TileLayerRenderer.prototype.removeInvisibleTiles_ = function() {
    var index, prune, x, y, z, tile;
    var xRight = this.xRight_;
    var yDown = this.yDown_;
    var top = this.renderedTop_;
    var right = this.renderedRight_;
    var bottom = this.renderedBottom_;
    var left = this.renderedLeft_;
    for (var xyz in this.renderedTiles_) {
        index = xyz.split(",");
        x = +index[0];
        y = +index[1];
        z = +index[2];
        prune = this.renderedZ_ !== z || 
            // beyond on the left side
            (xRight ? x < left : x > left) ||
            // beyond on the right side
            (xRight ? x > right : x < right) ||
            // above
            (yDown ? y < top : y > top) ||
            // below
            (yDown ? y > bottom : y < bottom);
        if (prune) {
            tile = this.renderedTiles_[xyz];
            delete this.renderedTiles_[xyz];
            this.container_.removeChild(tile.getImg());
        }
    }
};

/**
 * Deal with changes in resolution.
 * TODO: implement the animation
 *
 * @param {ol.Loc} center New center.
 * @param {number} resolution New resolution.
 */
ol.renderer.TileLayerRenderer.prototype.changeResolution_ = function(center, resolution) {
    this.renderedTiles_ = {};
    goog.dom.removeChildren(this.container_);
};


/**
 * Get an identifying string for this renderer.
 *
 * @export
 * @returns {string}
 */
ol.renderer.TileLayerRenderer.getType = function() {
    // TODO: revisit
    return "tile";
};

/** 
 * Determine if this renderer type is supported in this environment.
 *
 * @export
 * @return {boolean} This renderer is supported.
 */
ol.renderer.TileLayerRenderer.isSupported = function() {
    return true;
};

/** 
 * Determine if this renderer can render the given layer.
 *
 * @export
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} This renderer is capable of rendering the layer.
 */
ol.renderer.TileLayerRenderer.canRender = function(layer) {
    return layer instanceof ol.layer.TileLayer;
};

ol.renderer.Composite.register(ol.renderer.TileLayerRenderer);
