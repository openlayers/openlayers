// FIXME probably need to reset TileLayerZ if offsets get too large
// FIXME when zooming out, preserve higher Z divs to avoid white flash

goog.provide('ol.renderer.dom.TileLayer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.extent');
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
 * @protected
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
      goog.style.setElementShown(this.target, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
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
    extent = ol.extent.getForView2DAndSize(
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
  }, tileSource, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
      tilesToDrawByZ, getTileIfLoaded);

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = tileSource.getTile(z, x, y, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.LOADED) {
        tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
        continue;
      } else if (tileState == ol.TileState.ERROR ||
                 tileState == ol.TileState.EMPTY) {
        continue;
      }

      fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (!goog.isNull(childTileRange)) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }

  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);

  /** @type {Object.<number, boolean>} */
  var newTileLayerZKeys = {};

  var iz, iziz;
  var tileCoordKey, tileCoordOrigin, tileLayerZ, tileLayerZKey, tilesToDraw;
  for (iz = 0, iziz = zs.length; iz < iziz; ++iz) {
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

  var i, ii, j, origin, resolution;
  var transform = goog.vec.Mat4.createNumber();
  for (i = 0, ii = tileLayerZKeys.length; i < ii; ++i) {
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
        transform, frameState.size[0] / 2, frameState.size[1] / 2, 0);
    goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
    goog.vec.Mat4.scale(transform, resolution / view2DState.resolution,
        resolution / view2DState.resolution, 1);
    goog.vec.Mat4.translate(
        transform,
        (origin[0] - center[0]) / resolution,
        (center[1] - origin[1]) / resolution,
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
        tileLayerZ.removeTilesOutsideExtent(extent, tmpTileRange);
      }
    }
  }

  if (layerState.opacity != this.renderedOpacity_) {
    goog.style.setOpacity(this.target, layerState.opacity);
    this.renderedOpacity_ = layerState.opacity;
  }

  if (layerState.visible && !this.renderedVisible_) {
    goog.style.setElementShown(this.target, true);
    this.renderedVisible_ = true;
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, projection, extent,
      z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

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
  this.origin_ =
      ol.extent.getTopLeft(tileGrid.getTileCoordExtent(tileCoordOrigin));

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
  // Bootstrap sets the style max-width: 100% for all images, which breaks
  // prevents the tile from being displayed in FireFox.  Workaround by
  // overriding the max-width style.
  style.maxWidth = 'none';
  style.position = 'absolute';
  style.left =
      ((tileCoord.x - this.tileCoordOrigin_.x) * tileSize[0]) + 'px';
  style.top =
      ((this.tileCoordOrigin_.y - tileCoord.y) * tileSize[1]) + 'px';
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
 * @param {ol.TileRange=} opt_tileRange Temporary ol.TileRange object.
 */
ol.renderer.dom.TileLayerZ_.prototype.removeTilesOutsideExtent =
    function(extent, opt_tileRange) {
  var tileRange = this.tileGrid_.getTileRangeForExtentAndZ(
      extent, this.tileCoordOrigin_.z, opt_tileRange);
  var tilesToRemove = [];
  var tile, tileCoordKey;
  for (tileCoordKey in this.tiles_) {
    tile = this.tiles_[tileCoordKey];
    if (!tileRange.contains(tile.tileCoord)) {
      tilesToRemove.push(tile);
    }
  }
  var i, ii;
  for (i = 0, ii = tilesToRemove.length; i < ii; ++i) {
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
