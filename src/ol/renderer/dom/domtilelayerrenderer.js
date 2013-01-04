// FIXME probably need to reset TileLayerZ if offsets get too large
// FIXME when zooming out, preserve higher Z divs to avoid white flash

goog.provide('ol.renderer.dom.TileLayer');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.math.Vec2');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.TileLayer} tileLayer Tile layer.
 */
ol.renderer.dom.TileLayer = function(mapRenderer, tileLayer) {

  var target = goog.dom.createElement(goog.dom.TagName.DIV);
  target.className = 'ol-layer';
  target.style.position = 'absolute';

  goog.base(this, mapRenderer, tileLayer, target);

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {number}
   */
  this.renderedOpacity_ = 1;

  /**
   * @private
   * @type {Object.<number, ol.renderer.dom.TileLayerZ_>}
   */
  this.tileLayerZs_ = {};

};
goog.inherits(ol.renderer.dom.TileLayer, ol.renderer.dom.Layer);


/**
 * @return {ol.layer.TileLayer} Tile layer.
 */
ol.renderer.dom.TileLayer.prototype.getTileLayer = function() {
  return /** @type {ol.layer.TileLayer} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.dom.TileLayer.prototype.renderFrame = function(time) {

  var map = this.getMap();
  goog.asserts.assert(map.isDef());

  var view = map.getView().getView2D();
  var mapCenter = /** @type {!ol.Coordinate} */ (view.getCenter());
  var mapResolution = /** @type {number} */ (view.getResolution());
  var mapSize = /** @type {!ol.Size} */ (map.getSize());
  var mapRotatedExtent = /** @type {!ol.Extent} */
      (view.getRotatedExtent(mapSize));
  var mapRotation = view.getRotation();
  var mapScale = 1 / mapResolution;

  var tileLayer = this.getTileLayer();

  var visible = tileLayer.getVisible();
  if (!visible) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.target, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var opacity = tileLayer.getOpacity();
  if (opacity != this.renderedOpacity_) {
    goog.style.setOpacity(this.target, opacity);
    this.renderedOpacity_ = opacity;
  }

  var tileSource = tileLayer.getTileSource();
  var tileGrid = tileSource.getTileGrid();

  var z = tileGrid.getZForResolution(mapResolution);

  /** @type {Object.<number, Object.<string, ol.Tile>>} */
  var tilesToDrawByZ = {};

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      mapRotatedExtent, mapResolution);

  var allTilesLoaded = true;

  tilesToDrawByZ[z] = {};
  tileRange.forEachTileCoord(z, function(tileCoord) {

    var tile = tileSource.getTile(tileCoord);

    if (goog.isNull(tile)) {
      return;
    }

    var tileState = tile.getState();
    if (tileState == ol.TileState.IDLE) {
      tile.load();
    } else if (tileState == ol.TileState.LOADED) {
      tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
      return;
    } else if (tileState == ol.TileState.ERROR) {
      return;
    }

    allTilesLoaded = false;

    // FIXME this could be more efficient about filling partial holes
    tileGrid.forEachTileCoordParentTileRange(
        tileCoord,
        function(z, tileRange) {
          var fullyCovered = true;
          tileRange.forEachTileCoord(z, function(tileCoord) {
            var tileCoordKey = tileCoord.toString();
            if (tilesToDrawByZ[z] && tilesToDrawByZ[z][tileCoordKey]) {
              return;
            }
            var tile = tileSource.getTile(tileCoord);
            if (!goog.isNull(tile) &&
                tile.getState() == ol.TileState.LOADED) {
              if (!tilesToDrawByZ[z]) {
                tilesToDrawByZ[z] = {};
              }
              tilesToDrawByZ[z][tileCoordKey] = tile;
            } else {
              fullyCovered = false;
            }
          });
          return fullyCovered;
        });

  }, this);

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);

  /** @type {Object.<number, boolean>} */
  var newTileLayerZKeys = {};

  var tileSize = tileGrid.getTileSize();
  var iz, tileCoordKey, tileCoordOrigin, tileLayerZ, tileLayerZKey, tilesToDraw;
  for (iz = 0; iz < zs.length; ++iz) {
    tileLayerZKey = zs[iz];
    if (tileLayerZKey in this.tileLayerZs_) {
      tileLayerZ = this.tileLayerZs_[tileLayerZKey];
    } else {
      tileCoordOrigin =
          tileGrid.getTileCoordForCoordAndZ(mapCenter, tileLayerZKey);
      tileLayerZ = new ol.renderer.dom.TileLayerZ_(tileGrid, tileCoordOrigin);
      newTileLayerZKeys[tileLayerZKey] = true;
      this.tileLayerZs_[tileLayerZKey] = tileLayerZ;
    }
    tilesToDraw = tilesToDrawByZ[tileLayerZKey];
    for (tileCoordKey in tilesToDraw) {
      tileLayerZ.addTile(tilesToDraw[tileCoordKey]);
    }
    tileLayerZ.finalizeAddTiles();
  }

  /** @type {Array.<number>} */
  var tileLayerZKeys =
      goog.array.map(goog.object.getKeys(this.tileLayerZs_), Number);
  goog.array.sort(tileLayerZKeys);

  var i, j, origin, resolution;
  var transform = goog.vec.Mat4.createNumber();
  for (i = 0; i < tileLayerZKeys.length; ++i) {
    tileLayerZKey = tileLayerZKeys[i];
    tileLayerZ = this.tileLayerZs_[tileLayerZKey];
    if (!(tileLayerZKey in tilesToDrawByZ)) {
      goog.dom.removeNode(tileLayerZ.target);
      delete this.tileLayerZs_[tileLayerZKey];
      continue;
    }
    resolution = tileLayerZ.getResolution();
    origin = tileLayerZ.getOrigin();
    goog.vec.Mat4.makeIdentity(transform);
    goog.vec.Mat4.translate(
        transform, mapSize.width / 2, mapSize.height / 2, 0);
    if (goog.isDef(mapRotation)) {
      goog.vec.Mat4.rotateZ(transform, mapRotation);
    }
    goog.vec.Mat4.scale(
        transform, resolution / mapResolution, resolution / mapResolution, 1);
    goog.vec.Mat4.translate(transform, (origin.x - mapCenter.x) / resolution,
        (mapCenter.y - origin.y) / resolution, 0);
    tileLayerZ.setTransform(transform);
    if (tileLayerZKey in newTileLayerZKeys) {
      for (j = tileLayerZKey - 1; j >= 0; --j) {
        if (j in this.tileLayerZs_) {
          goog.dom.insertSiblingAfter(
              tileLayerZ.target, this.tileLayerZs_[j].target);
          break;
        }
      }
      if (j < 0) {
        goog.dom.insertChildAt(this.target, tileLayerZ.target, 0);
      }
    } else {
      tileLayerZ.removeTilesOutsideExtent(mapRotatedExtent);
    }
  }

  if (visible && !this.renderedVisible_) {
    goog.style.showElement(this.target, true);
    this.renderedVisible_ = true;
  }

  return !allTilesLoaded;

};



/**
 * @constructor
 * @private
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {ol.TileCoord} tileCoordOrigin Tile coord origin.
 */
ol.renderer.dom.TileLayerZ_ = function(tileGrid, tileCoordOrigin) {

  /**
   * @type {!Element}
   */
  this.target = goog.dom.createElement(goog.dom.TagName.DIV);
  this.target.style.position = 'absolute';

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid_ = tileGrid;

  /**
   * @private
   * @type {ol.TileCoord}
   */
  this.tileCoordOrigin_ = tileCoordOrigin;

  /**
   * @private
   * @type {!ol.Coordinate}
   */
  this.origin_ = /** @type {!ol.Coordinate} */
      (tileGrid.getTileCoordExtent(tileCoordOrigin).getTopLeft());

  /**
   * @private
   * @type {number}
   */
  this.resolution_ = tileGrid.getResolution(tileCoordOrigin.z);

  /**
   * @private
   * @type {Object.<string, ol.Tile>}
   */
  this.tiles_ = {};

  /**
   * @private
   * @type {DocumentFragment}
   */
  this.documentFragment_ = null;

  /**
   * @private
   * @type {goog.vec.Mat4.AnyType}
   */
  this.transform_ = goog.vec.Mat4.createNumberIdentity();

};


/**
 * @param {ol.Tile} tile Tile.
 */
ol.renderer.dom.TileLayerZ_.prototype.addTile = function(tile) {
  var tileCoord = tile.tileCoord;
  goog.asserts.assert(tileCoord.z == this.tileCoordOrigin_.z);
  var tileCoordKey = tileCoord.toString();
  if (tileCoordKey in this.tiles_) {
    return;
  }
  var tileSize = this.tileGrid_.getTileSize();
  var image = tile.getImage(this);
  var style = image.style;
  style.position = 'absolute';
  style.left =
      ((tileCoord.x - this.tileCoordOrigin_.x) * tileSize.width) + 'px';
  style.top =
      ((this.tileCoordOrigin_.y - tileCoord.y) * tileSize.height) + 'px';
  if (goog.isNull(this.documentFragment_)) {
    this.documentFragment_ = document.createDocumentFragment();
  }
  goog.dom.appendChild(this.documentFragment_, image);
  this.tiles_[tileCoordKey] = tile;
};


/**
 */
ol.renderer.dom.TileLayerZ_.prototype.finalizeAddTiles = function() {
  if (!goog.isNull(this.documentFragment_)) {
    goog.dom.appendChild(this.target, this.documentFragment_);
    this.documentFragment_ = null;
  }
};


/**
 * @return {!ol.Coordinate} Origin.
 */
ol.renderer.dom.TileLayerZ_.prototype.getOrigin = function() {
  return this.origin_;
};


/**
 * @return {number} Resolution.
 */
ol.renderer.dom.TileLayerZ_.prototype.getResolution = function() {
  return this.resolution_;
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.renderer.dom.TileLayerZ_.prototype.removeTilesOutsideExtent =
    function(extent) {
  var tileRange =
      this.tileGrid_.getTileRangeForExtentAndZ(extent, this.tileCoordOrigin_.z);
  var tilesToRemove = [];
  var tile, tileCoordKey;
  for (tileCoordKey in this.tiles_) {
    tile = this.tiles_[tileCoordKey];
    if (!tileRange.contains(tile.tileCoord)) {
      tilesToRemove.push(tile);
    }
  }
  var i;
  for (i = 0; i < tilesToRemove.length; ++i) {
    tile = tilesToRemove[i];
    tileCoordKey = tile.tileCoord.toString();
    goog.dom.removeNode(tile.getImage(this));
    delete this.tiles_[tileCoordKey];
  }
};


/**
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.renderer.dom.TileLayerZ_.prototype.setTransform = function(transform) {
  if (!goog.vec.Mat4.equals(transform, this.transform_)) {
    ol.dom.transformElement2D(this.target, transform);
    goog.vec.Mat4.setFromArray(this.transform_, transform);
  }
};
