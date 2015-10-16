// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw

goog.provide('ol.renderer.webgl.TileLayer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');
goog.require('goog.webgl');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.math');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.renderer.webgl.tilelayer.shader.Fragment');
goog.require('ol.renderer.webgl.tilelayer.shader.Locations');
goog.require('ol.renderer.webgl.tilelayer.shader.Vertex');
goog.require('ol.size');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');
goog.require('ol.webgl.Buffer');



/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Tile} tileLayer Tile layer.
 */
ol.renderer.webgl.TileLayer = function(mapRenderer, tileLayer) {

  goog.base(this, mapRenderer, tileLayer);

  /**
   * @private
   * @type {ol.webgl.shader.Fragment}
   */
  this.fragmentShader_ =
      ol.renderer.webgl.tilelayer.shader.Fragment.getInstance();

  /**
   * @private
   * @type {ol.webgl.shader.Vertex}
   */
  this.vertexShader_ = ol.renderer.webgl.tilelayer.shader.Vertex.getInstance();

  /**
   * @private
   * @type {ol.renderer.webgl.tilelayer.shader.Locations}
   */
  this.locations_ = null;

  /**
   * @private
   * @type {ol.webgl.Buffer}
   */
  this.renderArrayBuffer_ = new ol.webgl.Buffer([
    0, 0, 0, 1,
    1, 0, 1, 1,
    0, 1, 0, 0,
    1, 1, 1, 0
  ]);

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.renderedTileRange_ = null;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedFramebufferExtent_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = -1;

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [0, 0];

};
goog.inherits(ol.renderer.webgl.TileLayer, ol.renderer.webgl.Layer);


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.disposeInternal = function() {
  var context = this.mapRenderer.getContext();
  context.deleteBuffer(this.renderArrayBuffer_);
  goog.base(this, 'disposeInternal');
};


/**
 * Create a function that adds loaded tiles to the tile lookup.
 * @param {ol.source.Tile} source Tile source.
 * @param {ol.proj.Projection} projection Projection of the tiles.
 * @param {Object.<number, Object.<string, ol.Tile>>} tiles Lookup of loaded
 *     tiles by zoom level.
 * @return {function(number, ol.TileRange):boolean} A function that can be
 *     called with a zoom level and a tile range to add loaded tiles to the
 *     lookup.
 * @protected
 */
ol.renderer.webgl.TileLayer.prototype.createLoadedTileFinder =
    function(source, projection, tiles) {
  var mapRenderer = this.mapRenderer;

  return (
      /**
       * @param {number} zoom Zoom level.
       * @param {ol.TileRange} tileRange Tile range.
       * @return {boolean} The tile range is fully loaded.
       */
      function(zoom, tileRange) {
        return source.forEachLoadedTile(projection, zoom,
                                        tileRange, function(tile) {
              var loaded = mapRenderer.isTileTextureLoaded(tile);
              if (loaded) {
                if (!tiles[zoom]) {
                  tiles[zoom] = {};
                }
                tiles[zoom][tile.tileCoord.toString()] = tile;
              }
              return loaded;
            });
      });
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.handleWebGLContextLost = function() {
  goog.base(this, 'handleWebGLContextLost');
  this.locations_ = null;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.prepareFrame =
    function(frameState, layerState, context) {

  var mapRenderer = this.mapRenderer;
  var gl = context.getGL();

  var viewState = frameState.viewState;
  var projection = viewState.projection;

  var tileLayer = this.getLayer();
  goog.asserts.assertInstanceof(tileLayer, ol.layer.Tile,
      'layer is an instance of ol.layer.Tile');
  var tileSource = tileLayer.getSource();
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var z = tileGrid.getZForResolution(viewState.resolution);
  var tileResolution = tileGrid.getResolution(z);

  var tilePixelSize =
      tileSource.getTilePixelSize(z, frameState.pixelRatio, projection);
  var pixelRatio = tilePixelSize[0] /
      ol.size.toSize(tileGrid.getTileSize(z), this.tmpSize_)[0];
  var tilePixelResolution = tileResolution / pixelRatio;
  var tileGutter = tileSource.getGutter();

  var center = viewState.center;
  var extent;
  if (tileResolution == viewState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.extent.getForViewAndSize(
        center, tileResolution, viewState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  var framebufferExtent;
  if (this.renderedTileRange_ &&
      this.renderedTileRange_.equals(tileRange) &&
      this.renderedRevision_ == tileSource.getRevision()) {
    framebufferExtent = this.renderedFramebufferExtent_;
  } else {

    var tileRangeSize = tileRange.getSize();

    var maxDimension = Math.max(
        tileRangeSize[0] * tilePixelSize[0],
        tileRangeSize[1] * tilePixelSize[1]);
    var framebufferDimension = ol.math.roundUpToPowerOfTwo(maxDimension);
    var framebufferExtentDimension = tilePixelResolution * framebufferDimension;
    var origin = tileGrid.getOrigin(z);
    var minX = origin[0] +
        tileRange.minX * tilePixelSize[0] * tilePixelResolution;
    var minY = origin[1] +
        tileRange.minY * tilePixelSize[1] * tilePixelResolution;
    framebufferExtent = [
      minX, minY,
      minX + framebufferExtentDimension, minY + framebufferExtentDimension
    ];

    this.bindFramebuffer(frameState, framebufferDimension);
    gl.viewport(0, 0, framebufferDimension, framebufferDimension);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(goog.webgl.COLOR_BUFFER_BIT);
    gl.disable(goog.webgl.BLEND);

    var program = context.getProgram(this.fragmentShader_, this.vertexShader_);
    context.useProgram(program);
    if (!this.locations_) {
      this.locations_ =
          new ol.renderer.webgl.tilelayer.shader.Locations(gl, program);
    }

    context.bindBuffer(goog.webgl.ARRAY_BUFFER, this.renderArrayBuffer_);
    gl.enableVertexAttribArray(this.locations_.a_position);
    gl.vertexAttribPointer(
        this.locations_.a_position, 2, goog.webgl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.locations_.a_texCoord);
    gl.vertexAttribPointer(
        this.locations_.a_texCoord, 2, goog.webgl.FLOAT, false, 16, 8);
    gl.uniform1i(this.locations_.u_texture, 0);

    /**
     * @type {Object.<number, Object.<string, ol.Tile>>}
     */
    var tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};

    var findLoadedTiles = this.createLoadedTileFinder(
        tileSource, projection, tilesToDrawByZ);

    var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    var allTilesLoaded = true;
    var tmpExtent = ol.extent.createEmpty();
    var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
    var childTileRange, fullyLoaded, tile, tileState, x, y, tileExtent;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

        tile = tileSource.getTile(z, x, y, pixelRatio, projection);
        if (layerState.extent !== undefined) {
          // ignore tiles outside layer extent
          tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
          if (!ol.extent.intersects(tileExtent, layerState.extent)) {
            continue;
          }
        }
        tileState = tile.getState();
        if (tileState == ol.TileState.LOADED) {
          if (mapRenderer.isTileTextureLoaded(tile)) {
            tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
            continue;
          }
        } else if (tileState == ol.TileState.EMPTY ||
                   (tileState == ol.TileState.ERROR &&
                    !useInterimTilesOnError)) {
          continue;
        }

        allTilesLoaded = false;
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

    /** @type {Array.<number>} */
    var zs = Object.keys(tilesToDrawByZ).map(Number);
    goog.array.sort(zs);
    var u_tileOffset = goog.vec.Vec4.createFloat32();
    var i, ii, sx, sy, tileKey, tilesToDraw, tx, ty;
    for (i = 0, ii = zs.length; i < ii; ++i) {
      tilesToDraw = tilesToDrawByZ[zs[i]];
      for (tileKey in tilesToDraw) {
        tile = tilesToDraw[tileKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
        sx = 2 * (tileExtent[2] - tileExtent[0]) /
            framebufferExtentDimension;
        sy = 2 * (tileExtent[3] - tileExtent[1]) /
            framebufferExtentDimension;
        tx = 2 * (tileExtent[0] - framebufferExtent[0]) /
            framebufferExtentDimension - 1;
        ty = 2 * (tileExtent[1] - framebufferExtent[1]) /
            framebufferExtentDimension - 1;
        goog.vec.Vec4.setFromValues(u_tileOffset, sx, sy, tx, ty);
        gl.uniform4fv(this.locations_.u_tileOffset, u_tileOffset);
        mapRenderer.bindTileTexture(tile, tilePixelSize,
            tileGutter * pixelRatio, goog.webgl.LINEAR, goog.webgl.LINEAR);
        gl.drawArrays(goog.webgl.TRIANGLE_STRIP, 0, 4);
      }
    }

    if (allTilesLoaded) {
      this.renderedTileRange_ = tileRange;
      this.renderedFramebufferExtent_ = framebufferExtent;
      this.renderedRevision_ = tileSource.getRevision();
    } else {
      this.renderedTileRange_ = null;
      this.renderedFramebufferExtent_ = null;
      this.renderedRevision_ = -1;
      frameState.animate = true;
    }

  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  var tileTextureQueue = mapRenderer.getTileTextureQueue();
  this.manageTilePyramid(
      frameState, tileSource, tileGrid, pixelRatio, projection, extent, z,
      tileLayer.getPreload(),
      /**
       * @param {ol.Tile} tile Tile.
       */
      function(tile) {
        if (tile.getState() == ol.TileState.LOADED &&
            !mapRenderer.isTileTextureLoaded(tile) &&
            !tileTextureQueue.isKeyQueued(tile.getKey())) {
          tileTextureQueue.enqueue([
            tile,
            tileGrid.getTileCoordCenter(tile.tileCoord),
            tileGrid.getResolution(tile.tileCoord[0]),
            tilePixelSize, tileGutter * pixelRatio
          ]);
        }
      }, this);
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  var texCoordMatrix = this.texCoordMatrix;
  goog.vec.Mat4.makeIdentity(texCoordMatrix);
  goog.vec.Mat4.translate(texCoordMatrix,
      (center[0] - framebufferExtent[0]) /
          (framebufferExtent[2] - framebufferExtent[0]),
      (center[1] - framebufferExtent[1]) /
          (framebufferExtent[3] - framebufferExtent[1]),
      0);
  if (viewState.rotation !== 0) {
    goog.vec.Mat4.rotateZ(texCoordMatrix, viewState.rotation);
  }
  goog.vec.Mat4.scale(texCoordMatrix,
      frameState.size[0] * viewState.resolution /
          (framebufferExtent[2] - framebufferExtent[0]),
      frameState.size[1] * viewState.resolution /
          (framebufferExtent[3] - framebufferExtent[1]),
      1);
  goog.vec.Mat4.translate(texCoordMatrix,
      -0.5,
      -0.5,
      0);

  return true;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.TileLayer.prototype.forEachLayerAtPixel =
    function(pixel, frameState, callback, thisArg) {
  if (!this.framebuffer) {
    return undefined;
  }

  var pixelOnMapScaled = [
    pixel[0] / frameState.size[0],
    (frameState.size[1] - pixel[1]) / frameState.size[1]];

  var pixelOnFrameBufferScaled = [0, 0];
  ol.vec.Mat4.multVec2(
      this.texCoordMatrix, pixelOnMapScaled, pixelOnFrameBufferScaled);
  var pixelOnFrameBuffer = [
    pixelOnFrameBufferScaled[0] * this.framebufferDimension,
    pixelOnFrameBufferScaled[1] * this.framebufferDimension];

  var gl = this.mapRenderer.getContext().getGL();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  var imageData = new Uint8Array(4);
  gl.readPixels(pixelOnFrameBuffer[0], pixelOnFrameBuffer[1], 1, 1,
      gl.RGBA, gl.UNSIGNED_BYTE, imageData);

  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer());
  } else {
    return undefined;
  }
};
