goog.provide('ol3.renderer.dom.TileLayer');

goog.require('goog.dom');
goog.require('ol3.Coordinate');
goog.require('ol3.Extent');
goog.require('ol3.renderer.dom.Layer');



/**
 * @constructor
 * @extends {ol3.renderer.dom.Layer}
 * @param {ol3.renderer.Map} mapRenderer Map renderer.
 * @param {ol3.TileLayer} tileLayer Tile layer.
 * @param {!Element} target Target.
 */
ol3.renderer.dom.TileLayer = function(mapRenderer, tileLayer, target) {
  goog.base(this, mapRenderer, tileLayer, target);

  /**
   * @type {Object}
   * @private
   */
  this.renderedTiles_ = {};

  /**
   * @type {number|undefined}
   * @private
   */
  this.renderedMapResolution_ = undefined;
};
goog.inherits(ol3.renderer.dom.TileLayer, ol3.renderer.dom.Layer);


/**
 * @override
 * @return {ol3.TileLayer} Layer.
 */
ol3.renderer.dom.TileLayer.prototype.getLayer = function() {
  return /** @type {ol3.TileLayer} */ goog.base(this, 'getLayer');
};


/**
 * Get the pixel offset between the tile origin and the container origin.
 * @private
 * @param {number} z Z.
 * @param {number} resolution Resolution.
 * @return {ol3.Coordinate} Offset.
 */
ol3.renderer.dom.TileLayer.prototype.getTileOffset_ = function(z, resolution) {
  var tileLayer = this.getLayer();
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();
  var tileOrigin = tileGrid.getOrigin(z);
  var offset = new ol3.Coordinate(
      Math.round((this.origin.x - tileOrigin.x) / resolution),
      Math.round((tileOrigin.y - this.origin.y) / resolution));
  return offset;
};


/**
 * Get rid of tiles outside the rendered extent.
 * @private
 * @param {ol3.TileBounds} tileBounds Tile bounds.
 * @param {number} z Z.
 */
ol3.renderer.dom.TileLayer.prototype.removeInvisibleTiles_ = function(
    tileBounds, z) {
  var key, tileCoord, prune, tile;
  for (key in this.renderedTiles_) {
    tileCoord = ol3.TileCoord.createFromString(key);
    prune = z !== tileCoord.z ||
            tileCoord.x < tileBounds.minX ||
            tileCoord.x > tileBounds.maxX ||
            tileCoord.y < tileBounds.minY ||
            tileCoord.y > tileBounds.maxY;
    if (prune) {
      tile = this.renderedTiles_[key];
      delete this.renderedTiles_[key];
      goog.dom.removeNode(tile.getImage(this));
    }
  }
};


/**
 * @inheritDoc
 */
ol3.renderer.dom.TileLayer.prototype.render = function() {

  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }
  var mapExtent = /** @type {!ol3.Extent} */ map.getExtent();
  var mapResolution = /** @type {number} */ map.getResolution();

  var tileLayer = this.getLayer();
  var tileStore = tileLayer.getStore();
  var tileGrid = tileStore.getTileGrid();

  if (mapResolution != this.renderedMapResolution_) {
    this.renderedTiles_ = {};
    goog.dom.removeChildren(this.target);
  }

  // z represents the "best" resolution
  var z = tileGrid.getZForResolution(mapResolution);

  var tileBounds =
      tileGrid.getTileBoundsForExtentAndResolution(mapExtent, mapResolution);
  var tileOffset = this.getTileOffset_(z, mapResolution);

  var fragment = document.createDocumentFragment();

  var key, tile, pixelBounds, img, newTiles = false;
  tileBounds.forEachTileCoord(z, function(tileCoord) {
    key = tileCoord.toString();
    tile = this.renderedTiles_[key];
    if (!goog.isDef(tile)) {
      tile = tileStore.getTile(tileCoord);
      if (goog.isNull(tile)) {
      } else {
        tile.load();
        this.renderedTiles_[key] = tile;
        pixelBounds = tileGrid.getPixelBoundsForTileCoordAndResolution(
            tileCoord, mapResolution);
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
    goog.dom.appendChild(this.target, fragment);
  }

  this.removeInvisibleTiles_(tileBounds, z);
  this.renderedMapResolution_ = mapResolution;
};
