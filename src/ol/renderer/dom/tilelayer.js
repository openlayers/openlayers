goog.provide('ol.renderer.dom.TileLayer');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.renderer.dom.Layer');



/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.TileLayer} tileLayer Tile layer.
 * @param {!Element} target Target.
 */
ol.renderer.dom.TileLayer = function(mapRenderer, tileLayer, target) {
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

  /**
   * @type {ol.TileRange|undefined}
   * @private
   */
  this.renderedTileRange_ = undefined;

  /**
   * @type {number|undefined}
   * @private
   */
  this.renderedZ_ = undefined;

  /**
   * Map of tile keys loading at the currently rendered z.
   * @type {Object.<string, ol.Tile>}
   * @private
   */
  this.loadingTiles_ = {};

};
goog.inherits(ol.renderer.dom.TileLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 * @return {ol.layer.TileLayer} Layer.
 */
ol.renderer.dom.TileLayer.prototype.getLayer = function() {
  return /** @type {ol.layer.TileLayer} */ goog.base(this, 'getLayer');
};


/**
 * Get the pixel offset between the tile origin and the container origin.
 * @private
 * @param {number} z Z.
 * @param {number} resolution Resolution.
 * @return {ol.Coordinate} Offset.
 */
ol.renderer.dom.TileLayer.prototype.getTileOffset_ = function(z, resolution) {
  var tileLayer = this.getLayer();
  var tileSource = tileLayer.getTileSource();
  var tileGrid = tileSource.getTileGrid();
  var tileOrigin = tileGrid.getOrigin(z);
  var offset = new ol.Coordinate(
      Math.round((this.origin.x - tileOrigin.x) / resolution),
      Math.round((tileOrigin.y - this.origin.y) / resolution));
  return offset;
};


/**
 * Get rid of tiles that are not at the currently rendered z.
 * @private
 */
ol.renderer.dom.TileLayer.prototype.removeAltZTiles_ = function() {
  var tileRange = this.renderedTileRange_;
  var z = this.renderedZ_;
  var key, tileCoord, tile;
  for (key in this.renderedTiles_) {
    tileCoord = ol.TileCoord.createFromString(key);
    if (tileCoord.z !== z) {
      tile = this.renderedTiles_[key];
      delete this.renderedTiles_[key];
      goog.dom.removeNode(tile.getImage(this));
    }
  }
};


/**
 * Get rid of tiles outside the rendered extent.  Only removes tiles at the
 * currently rendered z.
 * @private
 */
ol.renderer.dom.TileLayer.prototype.removeOutOfRangeTiles_ = function() {
  var tileRange = this.renderedTileRange_;
  var z = this.renderedZ_;
  var key, tileCoord, prune, tile;
  for (key in this.renderedTiles_) {
    tileCoord = ol.TileCoord.createFromString(key);
    if (tileCoord.z === z) {
      prune = tileCoord.x < tileRange.minX ||
          tileCoord.x > tileRange.maxX ||
          tileCoord.y < tileRange.minY ||
          tileCoord.y > tileRange.maxY;
      if (prune) {
        tile = this.renderedTiles_[key];
        delete this.renderedTiles_[key];
        goog.dom.removeNode(tile.getImage(this));
      }
    }
  }
};


/**
 * @param {goog.events.Event} event Tile change event.
 * @private
 */
ol.renderer.dom.TileLayer.prototype.handleTileChange_ = function(event) {
  var tile = event.target;
  goog.asserts.assert(tile.getState() == ol.TileState.LOADED);
  var tileCoord = tile.tileCoord;
  if (tileCoord.z === this.renderedZ_) {
    var key = tileCoord.toString();
    delete this.loadingTiles_[key];
    // determine if we've fully loaded this zoom level
    var loaded = true;
    for (key in this.loadingTiles_) {
      loaded = false;
      break;
    }
    if (loaded) {
      this.removeAltZTiles_();
    }
  }
};


/**
 * @inheritDoc
 */
ol.renderer.dom.TileLayer.prototype.render = function() {

  var map = this.getMap();
  if (!map.isDef()) {
    return;
  }
  var mapExtent = /** @type {!ol.Extent} */ map.getExtent();
  var mapResolution = /** @type {number} */ map.getResolution();
  var resolutionChanged = (mapResolution !== this.renderedMapResolution_);

  var tileLayer = this.getLayer();
  var tileSource = tileLayer.getTileSource();
  var tileGrid = tileSource.getTileGrid();

  // z represents the "best" resolution
  var z = tileGrid.getZForResolution(mapResolution);

  if (z != this.renderedZ_) {
    // no longer wait for previously loading tiles
    this.loadingTiles_ = {};
  }

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var tileRange =
      tileGrid.getTileRangeForExtentAndResolution(mapExtent, mapResolution);


  // first pass through the tile range to determine all the tiles needed
  var allTilesLoaded = true;
  tileRange.forEachTileCoord(z, function(tileCoord) {
    var tile = tileSource.getTile(tileCoord);
    if (goog.isNull(tile)) {
      // we're outside the source's extent, continue
      return;
    }

    var key = tile.tileCoord.toString();
    if (tile.getState() == ol.TileState.LOADED) {
      tilesToDrawByZ[z][key] = tile;
      return;
    } else {
      if (!(key in this.loadingTiles_)) {
        goog.events.listen(tile, goog.events.EventType.CHANGE,
            this.handleTileChange_, false, this);
        this.loadingTiles_[key] = tile;
        tile.load();
      }
      allTilesLoaded = false;
      // TODO: only append after load?
      tilesToDrawByZ[z][key] = tile;
    }

    /**
     * Look for already loaded tiles at alternate z that can serve as
     * placeholders until tiles at the current z have loaded.
     *
     * TODO: make this more efficent for filling partial holes
     */
    tileGrid.forEachTileCoordParentTileRange(
        tileCoord,
        function(altZ, altTileRange) {
          var fullyCovered = true;
          altTileRange.forEachTileCoord(altZ, function(altTileCoord) {
            var tileKey = altTileCoord.toString();
            if (tilesToDrawByZ[altZ] && tilesToDrawByZ[altZ][tileKey]) {
              return;
            }
            var altTile = tileSource.getTile(altTileCoord);
            if (!goog.isNull(altTile) &&
                altTile.getState() == ol.TileState.LOADED) {
              if (!(altZ in tilesToDrawByZ)) {
                tilesToDrawByZ[altZ] = {};
              }
              tilesToDrawByZ[altZ][tileKey] = altTile;
            } else {
              fullyCovered = false;
            }
          });
          return fullyCovered;
        });

  }, this);

  /** @type {Array.<number>} */
  var zs = goog.object.getKeys(tilesToDrawByZ);
  goog.array.sort(zs);

  var fragment = document.createDocumentFragment();
  var altFragment = document.createDocumentFragment();
  var newTiles = false;
  var newAltTiles = false;
  for (var i = 0, ii = zs.length; i < ii; ++i) {
    var tileZ = zs[i];
    var tilesToDraw = tilesToDrawByZ[tileZ];
    var tileOffset = this.getTileOffset_(tileZ, mapResolution);
    for (var key in tilesToDraw) {
      var tile = tilesToDraw[key];
      var tileCoord = tile.tileCoord;
      var pixelBounds = tileGrid.getPixelBoundsForTileCoordAndResolution(
          tileCoord, mapResolution);
      var img = tile.getImage(this);
      var style = img.style;
      var append = !(key in this.renderedTiles_);
      if (append || resolutionChanged) {
        style.left = (pixelBounds.minX - tileOffset.x) + 'px';
        style.top = (-pixelBounds.maxY - tileOffset.y) + 'px';
        style.width = pixelBounds.getWidth() + 'px';
        style.height = pixelBounds.getHeight() + 'px';
      }
      if (append) {
        this.renderedTiles_[key] = tile;
        style.position = 'absolute';
        if (tileZ === z) {
          goog.dom.appendChild(fragment, img);
          newTiles = true;
        } else {
          goog.dom.appendChild(altFragment, img);
          newAltTiles = true;
        }
      }
    }
  }

  if (newAltTiles) {
    var child = this.target.firstChild;
    if (child) {
      goog.dom.insertSiblingBefore(altFragment, child);
    } else {
      goog.dom.appendChild(this.target, altFragment);
    }
  }
  if (newTiles) {
    goog.dom.appendChild(this.target, fragment);
  }

  this.renderedTileRange_ = tileRange;
  this.renderedZ_ = z;
  this.renderedMapResolution_ = mapResolution;

  if (allTilesLoaded) {
    this.removeAltZTiles_();
  }
  this.removeOutOfRangeTiles_();
};
