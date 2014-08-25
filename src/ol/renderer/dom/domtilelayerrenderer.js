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
goog.require('ol');
goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.dom.BrowserFeature');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Tile} tileLayer Tile layer.
 */
ol.renderer.dom.TileLayer = function(mapRenderer, tileLayer) {

  var target = goog.dom.createElement(goog.dom.TagName.DIV);
  target.style.position = 'absolute';

  // Needed for IE7-8 to render a transformed element correctly
  if (ol.dom.BrowserFeature.USE_MS_MATRIX_TRANSFORM) {
    target.style.width = '100%';
    target.style.height = '100%';
  }

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
   * @type {number}
   */
  this.renderedRevision_ = 0;

  /**
   * @private
   * @type {Object.<number, ol.renderer.dom.TileLayerZ_>}
   */
  this.tileLayerZs_ = {};

};
goog.inherits(ol.renderer.dom.TileLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.TileLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  if (!layerState.visible) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.target, false);
      this.renderedVisible_ = false;
    }
    return true;
  }

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var projection = viewState.projection;

  var tileLayer = this.getLayer();
  goog.asserts.assertInstanceof(tileLayer, ol.layer.Tile);
  var tileSource = tileLayer.getSource();
  goog.asserts.assertInstanceof(tileSource, ol.source.Tile);
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var tileGutter = tileSource.getGutter();
  var z = tileGrid.getZForResolution(viewState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var center = viewState.center;
  var extent;
  if (tileResolution == viewState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.extent.getForViewAndSize(
        center, tileResolution, viewState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }

  if (goog.isDef(layerState.extent)) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  /** @type {Object.<number, Object.<string, ol.Tile>>} */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return !goog.isNull(tile) && tile.getState() == ol.TileState.LOADED;
  }, tileSource, pixelRatio, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
      tilesToDrawByZ, getTileIfLoaded);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
  if (!goog.isDef(useInterimTilesOnError)) {
    useInterimTilesOnError = true;
  }

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.LOADED) {
        tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
        continue;
      } else if (tileState == ol.TileState.EMPTY ||
                 (tileState == ol.TileState.ERROR &&
                  !useInterimTilesOnError)) {
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

  // If the tile source revision changes, we destroy the existing DOM structure
  // so that a new one will be created.  It would be more efficient to modify
  // the existing structure.
  var tileLayerZ, tileLayerZKey;
  if (this.renderedRevision_ != tileSource.getRevision()) {
    for (tileLayerZKey in this.tileLayerZs_) {
      tileLayerZ = this.tileLayerZs_[+tileLayerZKey];
      goog.dom.removeNode(tileLayerZ.target);
    }
    this.tileLayerZs_ = {};
    this.renderedRevision_ = tileSource.getRevision();
  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);

  /** @type {Object.<number, boolean>} */
  var newTileLayerZKeys = {};

  var iz, iziz, tileCoordKey, tileCoordOrigin, tilesToDraw;
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
      tileLayerZ.addTile(tilesToDraw[tileCoordKey], tileGutter);
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
    ol.vec.Mat4.makeTransform2D(transform,
        frameState.size[0] / 2, frameState.size[1] / 2,
        resolution / viewState.resolution,
        resolution / viewState.resolution,
        viewState.rotation,
        (origin[0] - center[0]) / resolution,
        (center[1] - origin[1]) / resolution);
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
    ol.dom.setOpacity(this.target, layerState.opacity);
    this.renderedOpacity_ = layerState.opacity;
  }

  if (layerState.visible && !this.renderedVisible_) {
    goog.style.setElementShown(this.target, true);
    this.renderedVisible_ = true;
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  return true;
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
  this.target.style.width = '100%';
  this.target.style.height = '100%';

  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
    /**
     * Needed due to issues with IE7-8 clipping of transformed elements
     * Solution is to translate separately from the scaled/rotated elements
     * @private
     * @type {!Element}
     */
    this.translateTarget_ = goog.dom.createElement(goog.dom.TagName.DIV);
    this.translateTarget_.style.position = 'absolute';
    this.translateTarget_.style.width = '100%';
    this.translateTarget_.style.height = '100%';

    goog.dom.appendChild(this.target, this.translateTarget_);
  }

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
  this.resolution_ = tileGrid.getResolution(tileCoordOrigin[0]);

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
   * @type {goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumberIdentity();

};


/**
 * @param {ol.Tile} tile Tile.
 * @param {number} tileGutter Tile gutter.
 */
ol.renderer.dom.TileLayerZ_.prototype.addTile = function(tile, tileGutter) {
  var tileCoord = tile.tileCoord;
  var tileCoordZ = tileCoord[0];
  var tileCoordX = tileCoord[1];
  var tileCoordY = tileCoord[2];
  goog.asserts.assert(tileCoordZ == this.tileCoordOrigin_[0]);
  var tileCoordKey = ol.tilecoord.toString(tileCoord);
  if (tileCoordKey in this.tiles_) {
    return;
  }
  var tileSize = this.tileGrid_.getTileSize(tileCoordZ);
  var image = tile.getImage(this);
  var imageStyle = image.style;
  // Bootstrap sets the style max-width: 100% for all images, which
  // prevents the tile from being displayed in FireFox.  Workaround
  // by overriding the max-width style.
  imageStyle.maxWidth = 'none';
  var tileElement;
  var tileElementStyle;
  if (tileGutter > 0) {
    tileElement = goog.dom.createElement(goog.dom.TagName.DIV);
    tileElementStyle = tileElement.style;
    tileElementStyle.overflow = 'hidden';
    tileElementStyle.width = tileSize + 'px';
    tileElementStyle.height = tileSize + 'px';
    imageStyle.position = 'absolute';
    imageStyle.left = -tileGutter + 'px';
    imageStyle.top = -tileGutter + 'px';
    imageStyle.width = (tileSize + 2 * tileGutter) + 'px';
    imageStyle.height = (tileSize + 2 * tileGutter) + 'px';
    goog.dom.appendChild(tileElement, image);
  } else {
    imageStyle.width = tileSize + 'px';
    imageStyle.height = tileSize + 'px';
    tileElement = image;
    tileElementStyle = imageStyle;
  }
  tileElementStyle.position = 'absolute';
  tileElementStyle.left =
      ((tileCoordX - this.tileCoordOrigin_[1]) * tileSize) + 'px';
  tileElementStyle.top =
      ((this.tileCoordOrigin_[2] - tileCoordY) * tileSize) + 'px';
  if (goog.isNull(this.documentFragment_)) {
    this.documentFragment_ = document.createDocumentFragment();
  }
  goog.dom.appendChild(this.documentFragment_, tileElement);
  this.tiles_[tileCoordKey] = tile;
};


/**
 * FIXME empty description for jsdoc
 */
ol.renderer.dom.TileLayerZ_.prototype.finalizeAddTiles = function() {
  if (!goog.isNull(this.documentFragment_)) {
    if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
      goog.dom.appendChild(this.translateTarget_, this.documentFragment_);
    } else {
      goog.dom.appendChild(this.target, this.documentFragment_);
    }
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
      extent, this.tileCoordOrigin_[0], opt_tileRange);
  /** @type {Array.<ol.Tile>} */
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
    tileCoordKey = ol.tilecoord.toString(tile.tileCoord);
    goog.dom.removeNode(tile.getImage(this));
    delete this.tiles_[tileCoordKey];
  }
};


/**
 * @param {goog.vec.Mat4.Number} transform Transform.
 */
ol.renderer.dom.TileLayerZ_.prototype.setTransform = function(transform) {
  if (!ol.vec.Mat4.equals2D(transform, this.transform_)) {
    if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
      ol.dom.transformElement2D(this.target, transform, 6,
          this.translateTarget_);
    } else {
      ol.dom.transformElement2D(this.target, transform, 6);
    }
    goog.vec.Mat4.setFromArray(this.transform_, transform);
  }
};
