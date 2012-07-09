goog.provide('ol.renderer.TileLayerRenderer');

goog.require('ol.renderer.LayerRenderer');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Composite');
goog.require('ol.TileSet');
goog.require('ol.Bounds');

goog.require('goog.style');
goog.require('goog.math.Box');


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
    this.renderedZ_ = undefined;
    
};
goog.inherits(ol.renderer.TileLayerRenderer, ol.renderer.LayerRenderer);

/**
 * Render the layer.
 *
 * @param {!ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.TileLayerRenderer.prototype.draw = function(center, resolution) {
    if (resolution !== this.renderedResolution_) {
        this.changeResolution_(resolution);
    }
    var z = this.renderedZ_;
    var tileOrigin = this.tileOrigin_;

    var offset = this.getTileOffset_();
    var tileBox = this.getTileBox_(center, resolution);

    var fragment = document.createDocumentFragment();
    var ijz, key, tile, xyz, box, img, newTiles = false;
    for (var i=tileBox.left; i<tileBox.right; ++i) {
        for (var j=tileBox.top; j<tileBox.bottom; ++j) {
            ijz = [i, j, z];
            key = ijz.join(",");
            tile = this.renderedTiles_[key];
            if (!tile) {
                xyz = this.getTileCoordsFromNormalizedCoords_(ijz);
                tile = this.layer_.getTileForXYZ(xyz[0], xyz[1], xyz[2]);
                if (tile) {
                    if (!tile.isLoaded() && !tile.isLoading()) {
                        tile.load();
                    }
                    this.renderedTiles_[key] = tile;
                    box = this.getTilePixelBox_(ijz, resolution);
                    img = tile.getImg();
                    img.style.top = (box.top - offset.y) + "px";
                    img.style.left = (box.left - offset.x) + "px";
                    /**
                     * We need to set the size here even if the scale is 1 
                     * because the image may have been scaled previously.  If
                     * we want to avoid setting size unnecessarily, the tile
                     * should keep track of the scale.
                     */
                    img.style.height = (box.bottom - box.top) + "px";
                    img.style.width = (box.right - box.left) + "px";
                    goog.dom.appendChild(fragment, img);
                    newTiles = true;
                }
            }
        }
    }
    if (newTiles) {
        this.container_.appendChild(fragment);
    }

    this.renderedTileBox_ = tileBox;
    this.removeInvisibleTiles_();
};

/**
 * Get the pixel offset between the tile origin and the container origin.
 * TODO: cache this and invalidate it with changes to the container origin.
 *
 * @return {goog.math.Coordinate}
 */
ol.renderer.TileLayerRenderer.prototype.getTileOffset_ = function() {
    var resolution = this.renderedResolution_;
    return new goog.math.Coordinate(
        Math.round((this.containerOrigin_.getX() - this.tileOrigin_[0]) / resolution),
        Math.round((this.tileOrigin_[1] - this.containerOrigin_.getY()) / resolution)
    );    
};

/**
 * @param {Array.<number>} ijz
 * @param {number} resolution
 * @return {goog.math.Box}
 */
ol.renderer.TileLayerRenderer.prototype.getTilePixelBox_ = function(ijz, resolution) {
    var tileResolution = this.layerResolutions_[ijz[2]];
    var scale = resolution / tileResolution;
    var tileSize = this.tileSize_;

    // desired tile size (in fractional pixels)
    var fpxTileWidth = tileSize[0] / scale;
    var fpxTileHeight = tileSize[1] / scale;
    
    var col = ijz[0];
    var left = Math.round(col * fpxTileWidth); // inclusive
    var right = Math.round((col + 1) * fpxTileWidth); // exclusive
    
    var row = ijz[1];
    var top = Math.round(row * fpxTileHeight); // inclusive
    var bottom = Math.round((row + 1) * fpxTileWidth); // exclusive
    
    return new goog.math.Box(top, right, bottom, left);
};

/**
 * @param {ol.Loc} loc
 * @param {number} resolution
 * @return {goog.math.Coordinate}
 */
ol.renderer.TileLayerRenderer.prototype.getNormalizedTileCoord_ = function(loc, resolution) {
    var tileOrigin = this.tileOrigin_;
    var tileSize = this.tileSize_;
    var pair = this.getPreferredResAndZ_(resolution);
    var tileResolution = pair[0];
    var z = pair[1];
    var scale = resolution / tileResolution;

    // offset from tile origin in pixel space
    var dx = Math.round((loc.getX() - tileOrigin[0]) / resolution);
    var dy = Math.round((tileOrigin[1] - loc.getY()) / resolution);

    // desired tile size (in fractional pixels)
    var fpxTileWidth = tileSize[0] / scale;
    var fpxTileHeight = tileSize[1] / scale;
    
    // determine normalized col number (0 based, ascending right)
    var col = Math.floor(dx / fpxTileWidth);
    // determine normalized row number (0 based, ascending down)
    var row = Math.floor(dy / fpxTileHeight);
    
    var box = this.getTilePixelBox_([col, row, z], resolution);

    // adjust col to allow for stretched tiles
    if (dx < box.left) {
        col -= 1;
    } else if (dx >= box.right) {
        col += 1;
    }
    
    // adjust row to allow for stretched tiles
    if (dy < box.top) {
        row -= 1;
    } else if (dy >= box.bottom) {
        row += 1;
    }
    
    return new goog.math.Coordinate(col, row);
};

/**
 * @param {number} resolution
 * @return {Array.<number>}
 */
ol.renderer.TileLayerRenderer.prototype.getPreferredResAndZ_ = (function() {
    var cache = {};
    return function(resolution) {
        if (resolution in cache) {
            return cache[resolution];
        }
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
        var pair = cache[resolution] = [r, z];
        return pair;
    };
})();

/**
 * Tiles rendered at the current resolution;
 * @type {Object}
 */
ol.renderer.TileLayerRenderer.prototype.renderedTiles_ = {};

/**
 * @param {Array.<number>} ijz
 * @return {Array.<number>}
 */
ol.renderer.TileLayerRenderer.prototype.getTileCoordsFromNormalizedCoords_ = function(ijz) {
    return [
        this.xRight_ ? ijz[0] : -ijz[0] - 1,
        this.yDown_ ? ijz[1] : -ijz[1] - 1,
        ijz[2]
    ];
};

/**
 * @param {ol.Loc} center
 * @param {number} resolution
 * @return {goog.math.Box}
 */
ol.renderer.TileLayerRenderer.prototype.getTileBox_ = function(center, resolution) {
    var size = this.getContainerSize();
    var halfWidth = size.width / 2;
    var halfHeight = size.height / 2;

    var leftTop = new ol.Loc(
        center.getX() - (resolution * halfWidth),
        center.getY() + (resolution * halfHeight));

    var rightBottom = new ol.Loc(
        center.getX() + (resolution * halfWidth),
        center.getY() - (resolution * halfHeight));

    var ltCoord = this.getNormalizedTileCoord_(leftTop, resolution);
    var rbCoord = this.getNormalizedTileCoord_(rightBottom, resolution);

    // right and bottom are treated as excluded, so we increment for the box
    rbCoord.x += 1;
    rbCoord.y += 1;

    return goog.math.Box.boundingBox(ltCoord, rbCoord);
};

/**
 * Get rid of tiles outside the rendered extent.
 */
ol.renderer.TileLayerRenderer.prototype.removeInvisibleTiles_ = function() {
    var index, prune, i, j, z, tile;
    var box = this.renderedTileBox_;
    for (var ijz in this.renderedTiles_) {
        index = ijz.split(",");
        i = +index[0];
        j = +index[1];
        z = +index[2];
        prune = this.renderedZ_ !== z || 
            i < box.left || // beyond on the left side
            i >= box.right || // beyond on the right side
            j < box.top || // above
            j >= box.bottom; // below
        if (prune) {
            tile = this.renderedTiles_[ijz];
            delete this.renderedTiles_[ijz];
            this.container_.removeChild(tile.getImg());
        }
    }
};

/**
 * Deal with changes in resolution.
 * TODO: implement the animation
 *
 * @param {number} resolution New resolution.
 */
ol.renderer.TileLayerRenderer.prototype.changeResolution_ = function(resolution) {
    var pair = this.getPreferredResAndZ_(resolution);
    this.renderedZ_ = pair[1];
    this.renderedResolution_ = resolution;
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
