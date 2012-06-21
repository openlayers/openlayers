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
     * @type {ol.Bounds}
     * @private
     */
    this.rendererdBounds_ = null;

    /**
     * @type {number|undefined}
     * @private
     */
    this.renderedResolution_ = undefined;
    
    /**
     * @type {goog.math.Size}
     * @private
     */
    this.containerSize_ = null;

};

goog.inherits(ol.renderer.TileLayerRenderer, ol.renderer.LayerRenderer);



/**
 * @return {goog.math.Size}
 */
ol.renderer.TileLayerRenderer.prototype.getContainerSize_ = function() {
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
        this.renderedTiles_ = {};
    }
    var mapSize = this.getContainerSize_();
    var halfMapWidth = (resolution * mapSize.width) / 2;
    var halfMapHeight = (resolution * mapSize.height) / 2;
    var x = center.getX();
    var y = center.getY();
    var mapMinX = x - halfMapWidth;
    var mapMaxY = y + halfMapHeight;
    var projection = center.getProjection();
    var bounds = new ol.Bounds(
        mapMinX, y - halfMapHeight, x + halfMapWidth, mapMaxY, projection);
    var tileSet = this.layer_.getData(bounds, resolution);
    var tiles = tileSet.getTiles();
    var rows = tiles.length;
    var first = rows > 0 ? tiles[0][0] : null;
    if (first) {
        var cols = tiles[0].length;
        var tileResolution = tileSet.getResolution();
        var scale = resolution / tileResolution;
        // TODO: implement ol.TileSet#getBounds
        var firstBounds = first.getBounds();
        var tileMinX = firstBounds.getMinX();
        var tileMaxX = tileMinX;
        var tileMaxY = firstBounds.getMaxY();
        var tileMinY = tileMaxY;
        var pxOriginX = (tileMinX - mapMinX) / resolution;
        var pxOriginY = (mapMaxY - tileMaxY) / resolution;
        var pxTileHeight = tileSet.getTileHeight();
        var pxTileWidth = tileSet.getTileWidth();
        var tileHeight = tileResolution * pxTileHeight;
        var tileWidth = tileResolution * pxTileWidth;
        var fragment = document.createDocumentFragment();
        var tile, img;
        for (var j=0, pxTileTop=pxOriginY; j<rows; ++j, pxTileTop+=pxTileHeight) {
            tileMinY -= tileHeight;
            for (var i=0, pxTileLeft=pxOriginX; i<cols; ++i, pxTileLeft+=pxTileWidth) {
                tileMaxX += tileWidth;
                tile = tiles[j][i];
                img = tile.getImg();
                // TODO: scale is almost always 1, set size on the archetype img
                img.style.height = Math.round(pxTileHeight * scale) + "px";
                img.style.width = Math.round(pxTileWidth * scale) + "px";
                img.style.top = pxTileTop + "px";
                img.style.left = pxTileLeft + "px";
                tile.load();
                this.renderedTiles_[tile.getUrl()] = tile;
                fragment.appendChild(img);
            }
        }
        var renderedBounds =  new ol.Bounds(
            tileMinX, tileMinY, tileMaxX, tileMaxY, projection);
        this.pruneUnrenderedTiles_(renderedBounds);
        this.renderedBounds_ = renderedBounds;
        this.renderedResolution_ = resolution;
        this.container_.appendChild(fragment);
    }
};

/**
 * Get rid of tiles outside the newly rendered extent.
 *
 * @param {ol.Bounds} newBounds Newly rendered bounds.
 * @private
 */
ol.renderer.TileLayerRenderer.prototype.pruneUnrenderedTiles_ = function(newBounds) {
    for (var url in this.renderedTiles_) {
        var tile = this.renderedTiles_[url];
    }
};


/** @inheritDoc */
ol.renderer.TileLayerRenderer.prototype.getType = function() {
    // TODO: revisit
    return "img";
};

/** 
 * Determine if this renderer type is supported in this environment.
 *
 * @return {boolean} This renderer is supported.
 */
ol.renderer.TileLayerRenderer.isSupported = function() {
    return true;
};

/** 
 * Determine if this renderer can render the given layer.
 *
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} This renderer is capable of rendering the layer.
 */
ol.renderer.TileLayerRenderer.canRender = function(layer) {
    return layer instanceof ol.layer.TileLayer;
};

ol.renderer.Composite.register(ol.renderer.TileLayerRenderer);
