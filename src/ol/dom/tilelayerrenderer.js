goog.provide('ol.dom.TileLayerRenderer');

goog.require('goog.dom');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
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

  /**
   * @type {number|undefined}
   * @private
   */
  this.renderedResolution_ = undefined;
};
goog.inherits(ol.dom.TileLayerRenderer, ol.dom.LayerRenderer);


/**
 * @inheritDoc
 */
ol.dom.TileLayerRenderer.prototype.render = function() {

  var map = this.getMap();
  var center = map.getCenter();
  var resolution = map.getResolution();

  if (!goog.isDef(center) || !goog.isDef(resolution)) {
    return;
  }

  var tileStore = this.getTileStore_();
  var tileGrid = tileStore.getTileGrid();

  if (resolution != this.renderedResolution_) {
    this.renderedTiles_ = {};
    goog.dom.removeChildren(this.target);
  }

  // z represents the "best" resolution
  var z = tileGrid.getZForResolution(resolution);

  var tileBounds = this.getTileBounds_(center, resolution);
  var tileOffset = this.getTileOffset_(z, resolution);

  var fragment = document.createDocumentFragment();

  var key, tile, pixelBounds, img, newTiles = false;
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
        pixelBounds = tileGrid.getPixelBoundsForTileCoordAndResolution(
            tileCoord, resolution);
        img = tile.getImage(this);
        img.style.position = 'absolute';
        img.style.left = (pixelBounds.minX - tileOffset.x) + 'px';
        img.style.top = (-pixelBounds.maxY - tileOffset.y) + 'px';
        img.style.width = pixelBounds.getWidth() + 'px';
        img.style.height = pixelBounds.getHeight() + 'px';
        goog.dom.appendChild(fragment, img);
        newTiles = true;
      }
    }
  }, this);

  if (newTiles) {
    this.target.appendChild(fragment);
  }

  this.removeInvisibleTiles_(tileBounds, z);
  this.renderedResolution_ = resolution;
};


/**
 * Get the pixel offset between the tile origin and the container origin.
 * @private
 * @param {number} z Z.
 * @param {number} resolution Resolution.
 * @return {ol.Coordinate} Offset.
 */
ol.dom.TileLayerRenderer.prototype.getTileOffset_ = function(z, resolution) {
  var tileGrid = this.getTileGrid_();
  var tileOrigin = tileGrid.getOrigin(z);
  var offset = new ol.Coordinate(
      Math.round((this.origin.x - tileOrigin.x) / resolution),
      Math.round((tileOrigin.y - this.origin.y) / resolution));
  return offset;
};


/**
 * @private
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @return {ol.TileBounds} Tile bounds.
 */
ol.dom.TileLayerRenderer.prototype.getTileBounds_ = function(
    center, resolution) {
  var map = this.getMap();
  var size = map.getSize();
  var halfSize = new ol.Size(size.width / 2, size.height / 2);
  var leftTop = new ol.Coordinate(
      center.x - (resolution * halfSize.width),
      center.y + (resolution * halfSize.height));
  var rightBottom = new ol.Coordinate(
      center.x + (resolution * halfSize.width),
      center.y - (resolution * halfSize.height));
  var extent = ol.Extent.boundingExtent(leftTop, rightBottom);
  var tileGrid = this.getTileGrid_();
  return tileGrid.getTileBoundsForExtentAndResolution(extent, resolution);
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


/**
 * Get the tile grid.
 * @private
 * @return {ol.TileGrid} Tile grid.
 */
ol.dom.TileLayerRenderer.prototype.getTileGrid_ = function() {
  return this.getTileStore_().getTileGrid();
};


/**
 * Get the tile store.
 * @private
 * @return {ol.TileStore} Tile store.
 */
ol.dom.TileLayerRenderer.prototype.getTileStore_ = function() {
  var tileLayer = /** @type {ol.TileLayer} */ this.getLayer();
  return tileLayer.getStore();
};
