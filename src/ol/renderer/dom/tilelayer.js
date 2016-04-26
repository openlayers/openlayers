// FIXME probably need to reset TileLayerZ if offsets get too large
// FIXME when zooming out, preserve higher Z divs to avoid white flash

goog.provide('ol.renderer.dom.TileLayer');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.TileRange');
goog.require('ol.View');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.size');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.layer.Tile} tileLayer Tile layer.
 */
ol.renderer.dom.TileLayer = function(tileLayer) {

  var target = document.createElement('DIV');
  target.style.position = 'absolute';

  ol.renderer.dom.Layer.call(this, tileLayer, target);

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
   * @type {!Object.<number, ol.renderer.dom.TileLayerZ_>}
   */
  this.tileLayerZs_ = {};

};
ol.inherits(ol.renderer.dom.TileLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.TileLayer.prototype.clearFrame = function() {
  ol.dom.removeChildren(this.target);
  this.renderedRevision_ = 0;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.TileLayer.prototype.prepareFrame = function(frameState, layerState) {

  if (!layerState.visible) {
    if (this.renderedVisible_) {
      this.target.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return true;
  }

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var projection = viewState.projection;

  var tileLayer = /** @type {ol.layer.Tile} */ (this.getLayer());
  var tileSource = tileLayer.getSource();
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var tileGutter = pixelRatio * tileSource.getGutter(projection);
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

  if (layerState.extent !== undefined) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  /** @type {Object.<number, Object.<string, ol.Tile>>} */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, drawable, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      tileState = tile.getState();
      drawable = tileState == ol.Tile.State.LOADED ||
          tileState == ol.Tile.State.EMPTY ||
          tileState == ol.Tile.State.ERROR && !useInterimTilesOnError;
      if (!drawable && tile.interimTile) {
        tile = tile.interimTile;
      }
      tileState = tile.getState();
      if (tileState == ol.Tile.State.LOADED) {
        tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
        continue;
      } else if (tileState == ol.Tile.State.EMPTY ||
                 (tileState == ol.Tile.State.ERROR &&
                  !useInterimTilesOnError)) {
        continue;
      }
      fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (childTileRange) {
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
      ol.dom.removeNode(tileLayerZ.target);
    }
    this.tileLayerZs_ = {};
    this.renderedRevision_ = tileSource.getRevision();
  }

  /** @type {Array.<number>} */
  var zs = Object.keys(tilesToDrawByZ).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);

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
  var tileLayerZKeys = Object.keys(this.tileLayerZs_).map(Number);
  tileLayerZKeys.sort(ol.array.numberSafeCompareFunction);

  var i, ii, j, origin, resolution;
  var transform = ol.transform.create();
  for (i = 0, ii = tileLayerZKeys.length; i < ii; ++i) {
    tileLayerZKey = tileLayerZKeys[i];
    tileLayerZ = this.tileLayerZs_[tileLayerZKey];
    if (!(tileLayerZKey in tilesToDrawByZ)) {
      ol.dom.removeNode(tileLayerZ.target);
      delete this.tileLayerZs_[tileLayerZKey];
      continue;
    }
    resolution = tileLayerZ.getResolution();
    origin = tileLayerZ.getOrigin();

    ol.transform.compose(transform,
        frameState.size[0] / 2, frameState.size[1] / 2,
        resolution / viewState.resolution, resolution / viewState.resolution,
        viewState.rotation,
        (origin[0] - center[0]) / resolution, (center[1] - origin[1]) / resolution);

    tileLayerZ.setTransform(transform);
    if (tileLayerZKey in newTileLayerZKeys) {
      for (j = tileLayerZKey - 1; j >= 0; --j) {
        if (j in this.tileLayerZs_) {
          if (this.tileLayerZs_[j].target.parentNode) {
            this.tileLayerZs_[j].target.parentNode.insertBefore(tileLayerZ.target, this.tileLayerZs_[j].target.nextSibling);
          }
          break;
        }
      }
      if (j < 0) {
        this.target.insertBefore(tileLayerZ.target, this.target.childNodes[0] || null);
      }
    } else {
      if (!frameState.viewHints[ol.View.Hint.ANIMATING] &&
          !frameState.viewHints[ol.View.Hint.INTERACTING]) {
        tileLayerZ.removeTilesOutsideExtent(extent, tmpTileRange);
      }
    }
  }

  if (layerState.opacity != this.renderedOpacity_) {
    this.target.style.opacity = layerState.opacity;
    this.renderedOpacity_ = layerState.opacity;
  }

  if (layerState.visible && !this.renderedVisible_) {
    this.target.style.display = '';
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
  this.target = document.createElement('DIV');
  this.target.style.position = 'absolute';
  this.target.style.width = '100%';
  this.target.style.height = '100%';

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
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [0, 0];

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
  goog.DEBUG && console.assert(tileCoordZ == this.tileCoordOrigin_[0],
      'tileCoordZ matches z of tileCoordOrigin');
  var tileCoordKey = tileCoord.toString();
  if (tileCoordKey in this.tiles_) {
    return;
  }
  var tileSize = ol.size.toSize(
      this.tileGrid_.getTileSize(tileCoordZ), this.tmpSize_);
  var image = tile.getImage(this);
  var imageStyle = image.style;
  // Bootstrap sets the style max-width: 100% for all images, which
  // prevents the tile from being displayed in FireFox.  Workaround
  // by overriding the max-width style.
  imageStyle.maxWidth = 'none';
  var tileElement;
  var tileElementStyle;
  if (tileGutter > 0) {
    tileElement = document.createElement('DIV');
    tileElementStyle = tileElement.style;
    tileElementStyle.overflow = 'hidden';
    tileElementStyle.width = tileSize[0] + 'px';
    tileElementStyle.height = tileSize[1] + 'px';
    imageStyle.position = 'absolute';
    imageStyle.left = -tileGutter + 'px';
    imageStyle.top = -tileGutter + 'px';
    imageStyle.width = (tileSize[0] + 2 * tileGutter) + 'px';
    imageStyle.height = (tileSize[1] + 2 * tileGutter) + 'px';
    tileElement.appendChild(image);
  } else {
    imageStyle.width = tileSize[0] + 'px';
    imageStyle.height = tileSize[1] + 'px';
    tileElement = image;
    tileElementStyle = imageStyle;
  }
  tileElementStyle.position = 'absolute';
  tileElementStyle.left =
      ((tileCoordX - this.tileCoordOrigin_[1]) * tileSize[0]) + 'px';
  tileElementStyle.top =
      ((this.tileCoordOrigin_[2] - tileCoordY) * tileSize[1]) + 'px';
  if (!this.documentFragment_) {
    this.documentFragment_ = document.createDocumentFragment();
  }
  this.documentFragment_.appendChild(tileElement);
  this.tiles_[tileCoordKey] = tile;
};


/**
 * FIXME empty description for jsdoc
 */
ol.renderer.dom.TileLayerZ_.prototype.finalizeAddTiles = function() {
  if (this.documentFragment_) {
    this.target.appendChild(this.documentFragment_);
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
ol.renderer.dom.TileLayerZ_.prototype.removeTilesOutsideExtent = function(extent, opt_tileRange) {
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
    tileCoordKey = tile.tileCoord.toString();
    ol.dom.removeNode(tile.getImage(this));
    delete this.tiles_[tileCoordKey];
  }
};


/**
 * @param {ol.Transform} transform Transform.
 */
ol.renderer.dom.TileLayerZ_.prototype.setTransform = function(transform) {
  if (!ol.array.equals(transform, this.transform_)) {
    ol.dom.transformElement2D(this.target, transform, 6);
    ol.transform.setFromArray(this.transform_, transform);
  }
};
