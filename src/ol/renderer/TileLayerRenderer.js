goog.provide('ol.renderer.TileLayerRenderer');

goog.require('ol.renderer.LayerRenderer');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Composite');
goog.require('ol.TileSet');
goog.require('ol.Bounds');


/**
 * A single layer renderer that will be created by the composite map renderer.
 *
 * @constructor
 * @implements {ol.renderer.LayerRenderer}
 * @param {!Element} container
 * @param {!ol.layer.Layer} layer
 */
ol.renderer.TileLayerRenderer = function(container, layer) {
    
    /** 
     * @type {!Element} 
     * @private
     */
    this.container_ = container;
    
    /** 
     * @type {!ol.layer.Layer}
     * @private
     */
    this.layer_ = layer;
    
    /**
     * @type {ol.Bounds}
     * @private
     */
    this.rendererdBounds = null;

};

/**
 * Render the layer.
 *
 * @param {!ol.Loc} center
 * @param {number} resolution
 */
ol.renderer.TileLayerRenderer.prototype.draw = function(center, resolution) {
    var mapSize = goog.style.getSize(this.container_);
    var halfMapWidth = (resolution * mapSize.width) / 2;
    var halfMapHeight = (resolution * mapSize.height) / 2;
    var x = center.getX();
    var y = center.getY();
    var mapMinX = x - halfMapWidth;
    var mapMaxY = y + halfMapHeight;
    var bounds = new ol.Bounds(
        mapMinX, y - halfMapHeight, x + halfMapWidth, mapMaxY,
        center.getProjection()
    );
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
        var tileMaxY = firstBounds.getMaxY();
        var pxOriginX = (tileMinX - mapMinX) / resolution;
        var pxOriginY = (mapMaxY - tileMaxY) / resolution;
        var tileHeight = tileSet.getTileHeight();
        var tileWidth = tileSet.getTileWidth();
        var fragment = document.createDocumentFragment();
        var tile, img;
        for (var j=0, tileTop=pxOriginY; j<rows; ++j, tileTop+=tileHeight) {
            for (var i=0, tileLeft=pxOriginX; i<cols; ++i, tileLeft+=tileWidth) {
                tile = tiles[j][i];
                img = tile.getImg();
                // TODO: scale is almost always 1, set size on the archetype img
                img.style.height = Math.round(tileHeight * scale) + "px";
                img.style.width = Math.round(tileWidth * scale) + "px";
                img.style.top = tileTop + "px";
                img.style.left = tileLeft + "px";
                tile.load();
                fragment.appendChild(img);
            }
        }
        this.container_.appendChild(fragment);
    }
};

/** @inheritDoc */
ol.renderer.TileLayerRenderer.prototype.getLayer = function() {
    return this.layer_;
};

/** @inheritDoc */
ol.renderer.TileLayerRenderer.prototype.getType = function() {
    // TODO: revisit
    return "img";
};

/** 
 * Determine if this renderer type is supported in this environment.
 *
 * @returns {boolean} This renderer is supported.
 */
ol.renderer.TileLayerRenderer.isSupported = function() {
    return true;
};

/** 
 * Determine if this renderer can render the given layer.
 *
 * @param {ol.layer.Layer} layer The candidate layer.
 * @returns {boolean} This renderer is capable of rendering the layer.
 */
ol.renderer.TileLayerRenderer.canRender = function(layer) {
    return layer instanceof ol.layer.TileLayer;
};

ol.renderer.Composite.register(ol.renderer.TileLayerRenderer);
