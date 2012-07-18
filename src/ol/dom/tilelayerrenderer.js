goog.provide('ol.dom.TileLayerRenderer');

goog.require('ol.dom.LayerRenderer');



/**
 * @constructor
 * @extends {ol.dom.LayerRenderer}
 * @param {ol.dom.Map} map Map.
 * @param {ol.TileLayer} tileLayer Tile layer.
 * @param {!Element} target Target.
 */
ol.dom.TileLayerRenderer = function(map, tileLayer, target) {
  goog.base(this, map, tileLayer, target);

  /**
   * @type {Object}
   * @private
   */
  this.renderedTiles_ = {};
};
goog.inherits(ol.dom.TileLayerRenderer, ol.dom.LayerRenderer);


/**
 * @inheritDoc
 */
ol.dom.TileLayerRenderer.prototype.redraw = function() {

  var map = this.getMap();
  var extent = map.getExtent();
  var resolution = map.getResolution();

  if (!goog.isDef(extent) || !goog.isDef(resolution)) {
    return;
  }

  var tileLayer = /** @type {ol.TileLayer} */ (this.getLayer());
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();
  var z = tileGrid.getZForResolution(resolution);

  var tileBounds = tileGrid.getExtentTileBounds(z, extent);
  var tileSize = tileGrid.getTileSize();

  var offset = this.getTilesMapOffset_(extent, tileBounds, resolution);

  var fragment = document.createDocumentFragment();

  var key, tile, x, y, img, newTiles = false;
  tileBounds.forEachTileCoord(z, function(tileCoord) {
    key = tileCoord.toString();
    tile = this.renderedTiles_[key];
    if (!goog.isDef(tile)) {
      tile = tileStore.getTile(tileCoord);
      if (goog.isNull(tile)) {
      } else {
        if (!tile.isLoaded()) {
          tile.load();
        }
        this.renderedTiles_[key] = tile;
        x = tileSize.width * (tileCoord.x - tileBounds.minX);
        y = tileSize.height * (tileBounds.maxY - tileCoord.y);
        img = tile.getImage(this);
        img.style.position = 'absolute';
        img.style.top = (y - offset.y) + 'px';
        img.style.left = (x - offset.x) + 'px';
        img.style.width = tileSize.width + 'px';
        img.style.height = tileSize.height + 'px';
        goog.dom.appendChild(fragment, img);
        newTiles = true;
      }
    }
    return false;
  }, this);

  if (newTiles) {
    this.target.appendChild(fragment);
  }

  this.removeInvisibleTiles_(tileBounds, z);
};


/**
 * Get the pixel offset between top-left corner of tiles and top-left
 * corner of map. Return positive values.
 *
 * @private
 * @param {ol.Extent} extent Map extent.
 * @param {ol.TileBounds} tileBounds Tile bounds.
 * @param {number} resolution Resolution.
 * @return {goog.math.Coordinate} Offset.
 */
ol.dom.TileLayerRenderer.prototype.getTilesMapOffset_ = function(
    extent, tileBounds, resolution) {

  var tileLayer = /** @type {ol.TileLayer} */ (this.getLayer());
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();
  var z = tileGrid.getZForResolution(resolution);
  var tileCoord = new ol.TileCoord(z, tileBounds.minX, tileBounds.maxY);
  var tileCoordExtent = tileGrid.getTileCoordExtent(tileCoord);

  var offset = new goog.math.Coordinate(
      Math.round((this.origin.x - tileCoordExtent.minX) / resolution),
      Math.round((tileCoordExtent.maxY - this.origin.y) / resolution));

  return offset;
};


/**
 * Get rid of tiles outside the rendered extent.
 * @private
 * @param {ol.TileBounds} tileBounds Tile bounds.
 * @param {number} z Z.
 */
ol.dom.TileLayerRenderer.prototype.removeInvisibleTiles_ = function(
    tileBounds, z) {
  var key, tileCoord, prune, tile;
  for (key in this.renderedTiles_) {
    tileCoord = ol.TileCoord.fromString(key);
    prune = z !== tileCoord.z ||
            tileCoord.x < tileBounds.minX ||
            tileCoord.x > tileBounds.maxX ||
            tileCoord.y < tileBounds.minY ||
            tileCoord.y > tileBounds.maxY;
    if (prune) {
      tile = this.renderedTiles_[key];
      delete this.renderedTiles_[key];
      this.target.removeChild(tile.getImage(this));
    }
  }
};
