goog.provide('ol.renderer.canvas.VectorTileLayer');

goog.require('goog.asserts');
goog.require('ol.events');
goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.VectorTile');
goog.require('ol.ViewHint');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.geom.flat.transform');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.proj.Units');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.size');
goog.require('ol.source.VectorTile');
goog.require('ol.vec.Mat4');


/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.VectorTile} layer VectorTile layer.
 */
ol.renderer.canvas.VectorTileLayer = function(layer) {

  goog.base(this, layer);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {Array.<ol.VectorTile>}
   */
  this.renderedTiles_ = [];

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [NaN, NaN];

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpTransform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.VectorTileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.composeFrame = function(frameState, layerState, context) {

  var pixelRatio = frameState.pixelRatio;
  var skippedFeatureUids = layerState.managed ?
      frameState.skippedFeatureUids : {};
  var viewState = frameState.viewState;
  var center = viewState.center;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var rotation = viewState.rotation;
  var size = frameState.size;
  var pixelScale = pixelRatio / resolution;
  var layer = this.getLayer();
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tilePixelRatio = source.getTilePixelRatio(pixelRatio);

  var transform = this.getTransform(frameState, 0);

  this.dispatchPreComposeEvent(context, frameState, transform);

  var replayContext;
  if (layer.hasListener(ol.render.EventType.RENDER)) {
    // resize and clear
    this.context_.canvas.width = context.canvas.width;
    this.context_.canvas.height = context.canvas.height;
    replayContext = this.context_;
  } else {
    replayContext = context;
  }
  // for performance reasons, context.save / context.restore is not used
  // to save and restore the transformation matrix and the opacity.
  // see http://jsperf.com/context-save-restore-versus-variable
  var alpha = replayContext.globalAlpha;
  replayContext.globalAlpha = layerState.opacity;

  var tilesToDraw = this.renderedTiles_;
  var tileGrid = source.getTileGrid();

  var currentZ, height, i, ii, insertPoint, insertTransform, offsetX, offsetY;
  var origin, pixelSpace, replayState, resolutionRatio, tile, tileCenter;
  var tileContext, tileExtent, tilePixelResolution, tilePixelSize;
  var tileResolution, tileSize, tileTransform, width;
  for (i = 0, ii = tilesToDraw.length; i < ii; ++i) {
    tile = tilesToDraw[i];
    replayState = tile.getReplayState();
    tileExtent = tileGrid.getTileCoordExtent(
        tile.getTileCoord(), this.tmpExtent_);
    currentZ = tile.getTileCoord()[0];
    tileSize = ol.size.toSize(tileGrid.getTileSize(currentZ), this.tmpSize_);
    pixelSpace = tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS;
    tileResolution = tileGrid.getResolution(currentZ);
    tilePixelResolution = tileResolution / tilePixelRatio;
    resolutionRatio = tileResolution / resolution;
    offsetX = Math.round(pixelRatio * size[0] / 2);
    offsetY = Math.round(pixelRatio * size[1] / 2);
    width = tileSize[0] * pixelRatio * resolutionRatio;
    height = tileSize[1] * pixelRatio * resolutionRatio;
    var unscaledPixelTileSize = tileSize[0] * pixelRatio;
    if (width < unscaledPixelTileSize / 4 || width > unscaledPixelTileSize * 4) {
      if (pixelSpace) {
        origin = ol.extent.getTopLeft(tileExtent);
        tileTransform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
            offsetX, offsetY,
            pixelScale * tilePixelResolution,
            pixelScale * tilePixelResolution,
            rotation,
            (origin[0] - center[0]) / tilePixelResolution,
            (center[1] - origin[1]) / tilePixelResolution);
      } else {
        tileTransform = transform;
      }
      replayState.replayGroup.replay(replayContext, pixelRatio,
          tileTransform, rotation, skippedFeatureUids);
    } else {
      tilePixelSize = source.getTilePixelSize(currentZ, pixelRatio, projection);
      if (pixelSpace) {
        tileTransform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
            0, 0,
            pixelScale * tilePixelResolution, pixelScale * tilePixelResolution,
            rotation,
            -tilePixelSize[0] / 2, -tilePixelSize[1] / 2);
      } else {
        tileCenter = ol.extent.getCenter(tileExtent);
        tileTransform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
            0, 0,
            pixelScale, -pixelScale,
            -rotation,
            -tileCenter[0], -tileCenter[1]);
      }
      tileContext = tile.getContext();
      if (replayState.resolution !== resolution ||
          replayState.rotation !== rotation) {
        replayState.resolution = resolution;
        replayState.rotation = rotation;
        tileContext.canvas.width = width + 0.5;
        tileContext.canvas.height = height + 0.5;
        tileContext.translate(width / 2, height / 2);
        tileContext.rotate(-rotation);
        replayState.replayGroup.replay(tileContext, pixelRatio,
            tileTransform, rotation, skippedFeatureUids, false);
      }
      insertTransform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
          0, 0, pixelScale, -pixelScale, 0, -center[0], -center[1]);
      insertPoint = ol.geom.flat.transform.transform2D(
          ol.extent.getTopLeft(tileExtent), 0, 1, 2, insertTransform);
      replayContext.drawImage(tileContext.canvas,
          Math.round(insertPoint[0] + offsetX),
          Math.round(insertPoint[1]) + offsetY);
    }
  }

  if (replayContext != context) {
    this.dispatchRenderEvent(replayContext, frameState, transform);
    context.drawImage(replayContext.canvas, 0, 0);
  }
  replayContext.globalAlpha = alpha;

  this.dispatchPostComposeEvent(context, frameState, transform);
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {ol.layer.VectorTile} layer Vector tile layer.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 */
ol.renderer.canvas.VectorTileLayer.prototype.createReplayGroup = function(tile,
    layer, pixelRatio, projection) {
  var revision = layer.getRevision();
  var renderOrder = layer.getRenderOrder() || null;

  var replayState = tile.getReplayState();
  if (!replayState.dirty && replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return;
  }

  // FIXME dispose of old replayGroup in post render
  goog.dispose(replayState.replayGroup);
  replayState.replayGroup = null;
  replayState.dirty = false;

  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var tileCoord = tile.getTileCoord();
  var tileProjection = tile.getProjection();
  var pixelSpace = tileProjection.getUnits() == ol.proj.Units.TILE_PIXELS;
  var extent, reproject;
  if (pixelSpace) {
    var tilePixelSize = source.getTilePixelSize(tileCoord[0], pixelRatio,
        tile.getProjection());
    extent = [0, 0, tilePixelSize[0], tilePixelSize[1]];
  } else {
    extent = tileGrid.getTileCoordExtent(tileCoord);
    if (!ol.proj.equivalent(projection, tileProjection)) {
      reproject = true;
      tile.setProjection(projection);
    }
  }
  var resolution = tileGrid.getResolution(tileCoord[0]);
  var tileResolution =
      pixelSpace ? source.getTilePixelRatio(pixelRatio) : resolution;
  replayState.dirty = false;
  var replayGroup = new ol.render.canvas.ReplayGroup(0, extent,
      tileResolution, layer.getRenderBuffer());
  var squaredTolerance = ol.renderer.vector.getSquaredTolerance(
      tileResolution, pixelRatio);

  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @this {ol.renderer.canvas.VectorTileLayer}
   */
  function renderFeature(feature) {
    var styles;
    var styleFunction = feature.getStyleFunction();
    if (styleFunction) {
      goog.asserts.assertInstanceof(feature, ol.Feature, 'Got an ol.Feature');
      styles = styleFunction.call(feature, resolution);
    } else {
      styleFunction = layer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
    }
    if (styles) {
      if (!goog.isArray(styles)) {
        styles = [styles];
      }
      var dirty = this.renderFeature(feature, squaredTolerance, styles,
          replayGroup);
      this.dirty_ = this.dirty_ || dirty;
      replayState.dirty = replayState.dirty || dirty;
    }
  }

  var features = tile.getFeatures();
  if (renderOrder && renderOrder !== replayState.renderedRenderOrder) {
    features.sort(renderOrder);
  }
  var feature;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    if (reproject) {
      feature.getGeometry().transform(tileProjection, projection);
    }
    renderFeature.call(this, feature);
  }

  replayGroup.finish();

  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
  replayState.replayGroup = replayGroup;
  replayState.resolution = NaN;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  var pixelRatio = frameState.pixelRatio;
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var layer = this.getLayer();
  /** @type {Object.<string, boolean>} */
  var features = {};

  var replayables = this.renderedTiles_;
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var found, tileSpaceCoordinate;
  var i, ii, origin, replayGroup;
  var tile, tileCoord, tileExtent, tilePixelRatio, tileResolution;
  for (i = 0, ii = replayables.length; i < ii; ++i) {
    tile = replayables[i];
    tileCoord = tile.getTileCoord();
    tileExtent = source.getTileGrid().getTileCoordExtent(tileCoord,
        this.tmpExtent_);
    if (!ol.extent.containsCoordinate(tileExtent, coordinate)) {
      continue;
    }
    if (tile.getProjection().getUnits() === ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(tileExtent);
      tilePixelRatio = source.getTilePixelRatio(pixelRatio);
      tileResolution = tileGrid.getResolution(tileCoord[0]) / tilePixelRatio;
      tileSpaceCoordinate = [
        (coordinate[0] - origin[0]) / tileResolution,
        (origin[1] - coordinate[1]) / tileResolution
      ];
      resolution = tilePixelRatio;
    } else {
      tileSpaceCoordinate = coordinate;
    }
    replayGroup = tile.getReplayState().replayGroup;
    found = found || replayGroup.forEachFeatureAtCoordinate(
        tileSpaceCoordinate, resolution, rotation, {},
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          goog.asserts.assert(feature, 'received a feature');
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
  }
  return found;
};


/**
 * Handle changes in image style state.
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.prepareFrame = function(frameState, layerState) {
  var layer = /** @type {ol.layer.Vector} */ (this.getLayer());
  goog.asserts.assertInstanceof(layer, ol.layer.VectorTile,
      'layer is an instance of ol.layer.VectorTile');
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');

  this.updateAttributions(
      frameState.attributions, source.getAttributions());
  this.updateLogos(frameState, source);

  var animating = frameState.viewHints[ol.ViewHint.ANIMATING];
  var interacting = frameState.viewHints[ol.ViewHint.INTERACTING];
  var updateWhileAnimating = layer.getUpdateWhileAnimating();
  var updateWhileInteracting = layer.getUpdateWhileInteracting();

  if (!this.dirty_ && (!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  var extent = frameState.extent;
  if (layerState.extent) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;

  var tileGrid = source.getTileGrid();
  var resolutions = tileGrid.getResolutions();
  var z = resolutions.length - 1;
  while (z > 0 && resolutions[z] < resolution) {
    --z;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
  this.updateUsedTiles(frameState.usedTiles, source, z, tileRange);
  this.manageTilePyramid(frameState, source, tileGrid, pixelRatio,
      projection, extent, z, layer.getPreload());
  this.scheduleExpireCache(frameState, source);

  /**
   * @type {Object.<number, Object.<string, ol.VectorTile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(source, projection,
      tilesToDrawByZ);

  var useInterimTilesOnError = layer.getUseInterimTilesOnError();

  var tmpExtent = this.tmpExtent_;
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = source.getTile(z, x, y, pixelRatio, projection);
      goog.asserts.assertInstanceof(tile, ol.VectorTile,
          'Tile is an ol.VectorTile');
      tileState = tile.getState();
      if (tileState == ol.TileState.LOADED ||
          tileState == ol.TileState.EMPTY ||
          (tileState == ol.TileState.ERROR && !useInterimTilesOnError)) {
        tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
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

  this.dirty_ = false;

  /** @type {Array.<number>} */
  var zs = Object.keys(tilesToDrawByZ).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);
  var replayables = [];
  var i, ii, currentZ, tileCoordKey, tilesToDraw;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    currentZ = zs[i];
    tilesToDraw = tilesToDrawByZ[currentZ];
    for (tileCoordKey in tilesToDraw) {
      tile = tilesToDraw[tileCoordKey];
      if (tile.getState() == ol.TileState.LOADED) {
        replayables.push(tile);
        this.createReplayGroup(tile, layer, pixelRatio, projection);
      }
    }
  }

  this.renderedTiles_ = replayables;

  return true;
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {(ol.style.Style|Array.<ol.style.Style>)} styles The style or array of
 *     styles.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderFeature = function(feature, squaredTolerance, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var loading = false;
  if (goog.isArray(styles)) {
    for (var i = 0, ii = styles.length; i < ii; ++i) {
      loading = ol.renderer.vector.renderFeature(
          replayGroup, feature, styles[i], squaredTolerance,
          this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles, squaredTolerance,
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
