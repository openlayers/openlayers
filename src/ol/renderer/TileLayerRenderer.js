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
     * @type {number}
     */
    this.xRight_ = layer.getXRight() ? 1 : -1;

    /**
     * @type {number}
     */
    this.yDown_ = layer.getYDown() ? 1 : -1;

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
    
    var pxMapSize = this.getContainerSize_();
    var xRight = this.xRight_;
    var yDown = this.yDown_;

    var halfMapWidth = (resolution * pxMapSize.width) / 2;
    var halfMapHeight = (resolution * pxMapSize.height) / 2;
    var centerX = center.getX();
    var centerY = center.getY();
    var mapMinX = centerX - halfMapWidth;
    var mapMaxY = centerY + halfMapHeight;
    var pxOffsetX = Math.round((mapMinX - this.tileOrigin_[0]) / resolution);
    var pxOffsetY = Math.round((this.tileOrigin_[1] - mapMaxY) / resolution);
    
    // this gives us the desired size in fractional pixels
    var pxTileWidth = this.tileSize_[0] / scale;
    var pxTileHeight = this.tileSize_[1] / scale;
    
    // this is the index of the top left tile
    var leftTileX = Math.floor(xRight * pxOffsetX / pxTileWidth);
    var topTileY = Math.floor(yDown * pxOffsetY / pxTileHeight);

    var pxMinX;
    if (xRight > 0) {
        pxMinX = Math.round(leftTileX * pxTileWidth) - pxOffsetX;
    } else {
        pxMinX = Math.round((-leftTileX-1) * pxTileWidth) - pxOffsetX;
    }
    var pxMinY;
    if (yDown > 0) {
        pxMinY = Math.round(topTileY * pxTileHeight) - pxOffsetY;
    } else {
        pxMinY = Math.round((-topTileY-1) * pxTileHeight) - pxOffsetY;
    }

    var pxTileLeft = pxMinX;
    var pxTileTop = pxMinY;

    var numTilesWide = Math.ceil(pxMapSize.width / pxTileWidth);
    var numTilesHigh = Math.ceil(pxMapSize.height / pxTileHeight);
    
    // assume a buffer of zero for now
    if (pxMinX < 0) {
        numTilesWide += 1;
    }
    if (pxMinY < 0) {
        numTilesHigh += 1;
    }

    var tileX, tileY, tile, img, pxTileRight, pxTileBottom, xyz, append;
    var fragment = document.createDocumentFragment();
    var newTiles = false;
    for (var i=0; i<numTilesWide; ++i) {
        pxTileTop = pxMinY;
        tileX = leftTileX + (i * xRight);
        if (scale !== 1) {
            pxTileRight = Math.round(pxMinX + ((i+1) * pxTileWidth));
        } else {
            pxTileRight = pxTileLeft + pxTileWidth;
        }
        for (var j=0; j<numTilesHigh; ++j) {
            append = false;
            tileY = topTileY + (j * yDown);
            xyz = tileX + "," + tileY + "," + tileZ;
            if (scale !== 1) {
                pxTileBottom = Math.round(pxMinY + ((j+1) * pxTileHeight));
            } else {
                pxTileBottom = pxTileTop + pxTileHeight;
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
                    goog.dom.appendChild(fragment, img);
                    newTiles = true;
                }
            } else {
                img = tile.getImg();
            }
            if (img) {
                img.style.top = pxTileTop + "px";
                img.style.left = pxTileLeft + "px";
                if (scale !== 1) {
                    img.style.height = (pxTileRight - pxTileLeft) + "px";
                    img.style.width = (pxTileBottom - pxTileTop) + "px";
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
    var xRight = (this.xRight_ > 0);
    var yDown = (this.yDown_ > 0);
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
