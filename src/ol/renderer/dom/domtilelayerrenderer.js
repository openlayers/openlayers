// FIXME probably need to reset TileLayerZ if offsets get too large
// FIXME when zooming out, preserve higher Z divs to avoid white flash

goog.provide('ol.renderer.dom.TileLayer');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.layer.TileLayer');
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
  target.className = 'ol-layer-tile';
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
ol.renderer.dom.TileLayer.prototype.renderFrame =
    function(frameState, layerState) {

  if (!layerState.visible) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.target, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  if (goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection);
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var center = view2DState.center;
  var extent;
  if (tileResolution == view2DState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.Extent.getForView2DAndSize(
        center, tileResolution, view2DState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  /** @type {Object.<number, Object.<string, ol.Tile>>} */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return !goog.isNull(tile) && tile.getState() == ol.TileState.LOADED;
  }, tileSource, tileGrid, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
      tilesToDrawByZ, getTileIfLoaded);

  var allTilesLoaded = true;
  var tile, tileCenter, tileCoord, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tileCoord = new ol.TileCoord(z, x, y);
      tile = tileSource.getTile(tileCoord, tileGrid, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.IDLE) {
        this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
        tileCenter = tileGrid.getTileCoordCenter(tileCoord);
        frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter);
      } else if (tileState == ol.TileState.LOADED) {
        tilesToDrawByZ[z][tileCoord.toString()] = tile;
        continue;
      } else if (tileState == ol.TileState.ERROR ||
                 tileState == ol.TileState.EMPTY) {
        continue;
      }

      allTilesLoaded = false;
      tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles);

    }

  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);

  /** @type {Object.<number, boolean>} */
  var newTileLayerZKeys = {};

  var iz, tileCoordKey, tileCoordOrigin, tileLayerZ, tileLayerZKey, tilesToDraw;
  for (iz = 0; iz < zs.length; ++iz) {
    tileLayerZKey = zs[iz];
    if (tileLayerZKey in this.tileLayerZs_) {
      tileLayerZ = this.tileLayerZs_[tileLayerZKey];
    } else {
      tileCoordOrigin =
          tileGrid.getTileCoordForCoordAndZ(center, tileLayerZKey);
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
        transform, frameState.size.width / 2, frameState.size.height / 2, 0);
    goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
    goog.vec.Mat4.scale(transform, resolution / view2DState.resolution,
        resolution / view2DState.resolution, 1);
    goog.vec.Mat4.translate(
        transform,
        (origin.x - center.x) / resolution,
        (center.y - origin.y) / resolution,
        0);
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
      if (!frameState.viewHints[ol.ViewHint.ANIMATING] &&
          !frameState.viewHints[ol.ViewHint.INTERACTING]) {
        tileLayerZ.removeTilesOutsideExtent(extent);
      }
    }
  }

  if (layerState.opacity != this.renderedOpacity_) {
    goog.style.setOpacity(this.target, layerState.opacity);
    this.renderedOpacity_ = layerState.opacity;
  }

  if (layerState.visible && !this.renderedVisible_) {
    goog.style.showElement(this.target, true);
    this.renderedVisible_ = true;
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  tileSource.useLowResolutionTiles(z, extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource);

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
   * @type {ol.Coordinate}
   */
  this.origin_ = tileGrid.getTileCoordExtent(tileCoordOrigin).getTopLeft();

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
  var tileSize = this.tileGrid_.getTileSize(tileCoord.z);
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
 * FIXME empty description for jsdoc
 */
ol.renderer.dom.TileLayerZ_.prototype.finalizeAddTiles = function() {
  if (!goog.isNull(this.documentFragment_)) {
    goog.dom.appendChild(this.target, this.documentFragment_);
    this.documentFragment_ = null;
  }
};


/**
 * @return {ol.Coordinate} Origin.
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
    ol.dom.transformElement2D(this.target, transform, 6);
    goog.vec.Mat4.setFromArray(this.transform_, transform);
  }
};
