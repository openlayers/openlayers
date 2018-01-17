/**
 * @module ol/renderer/webgl/TileLayer
 */
// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw

import {inherits} from '../../index.js';
import LayerType from '../../LayerType.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {numberSafeCompareFunction} from '../../array.js';
import {createEmpty, intersects} from '../../extent.js';
import {roundUpToPowerOfTwo} from '../../math.js';
import RendererType from '../Type.js';
import WebGLLayerRenderer from '../webgl/Layer.js';
import _ol_renderer_webgl_tilelayershader_ from '../webgl/tilelayershader.js';
import _ol_renderer_webgl_tilelayershader_Locations_ from '../webgl/tilelayershader/Locations.js';
import _ol_size_ from '../../size.js';
import _ol_transform_ from '../../transform.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Buffer_ from '../../webgl/Buffer.js';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Tile} tileLayer Tile layer.
 * @api
 */
const WebGLTileLayerRenderer = function(mapRenderer, tileLayer) {

  WebGLLayerRenderer.call(this, mapRenderer, tileLayer);

  /**
   * @private
   * @type {ol.webgl.Fragment}
   */
  this.fragmentShader_ = _ol_renderer_webgl_tilelayershader_.fragment;

  /**
   * @private
   * @type {ol.webgl.Vertex}
   */
  this.vertexShader_ = _ol_renderer_webgl_tilelayershader_.vertex;

  /**
   * @private
   * @type {ol.renderer.webgl.tilelayershader.Locations}
   */
  this.locations_ = null;

  /**
   * @private
   * @type {ol.webgl.Buffer}
   */
  this.renderArrayBuffer_ = new _ol_webgl_Buffer_([
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

inherits(WebGLTileLayerRenderer, WebGLLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLTileLayerRenderer['handles'] = function(type, layer) {
  return type === RendererType.WEBGL && layer.getType() === LayerType.TILE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.TileLayer} The layer renderer.
 */
WebGLTileLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLTileLayerRenderer(
    /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
    /** @type {ol.layer.Tile} */ (layer)
  );
};


/**
 * @inheritDoc
 */
WebGLTileLayerRenderer.prototype.disposeInternal = function() {
  const context = this.mapRenderer.getContext();
  context.deleteBuffer(this.renderArrayBuffer_);
  WebGLLayerRenderer.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
WebGLTileLayerRenderer.prototype.createLoadedTileFinder = function(source, projection, tiles) {
  const mapRenderer = this.mapRenderer;

  return (
    /**
     * @param {number} zoom Zoom level.
     * @param {ol.TileRange} tileRange Tile range.
     * @return {boolean} The tile range is fully loaded.
     */
    function(zoom, tileRange) {
      function callback(tile) {
        const loaded = mapRenderer.isTileTextureLoaded(tile);
        if (loaded) {
          if (!tiles[zoom]) {
            tiles[zoom] = {};
          }
          tiles[zoom][tile.tileCoord.toString()] = tile;
        }
        return loaded;
      }
      return source.forEachLoadedTile(projection, zoom, tileRange, callback);
    });
};


/**
 * @inheritDoc
 */
WebGLTileLayerRenderer.prototype.handleWebGLContextLost = function() {
  WebGLLayerRenderer.prototype.handleWebGLContextLost.call(this);
  this.locations_ = null;
};


/**
 * @inheritDoc
 */
WebGLTileLayerRenderer.prototype.prepareFrame = function(frameState, layerState, context) {

  const mapRenderer = this.mapRenderer;
  const gl = context.getGL();

  const viewState = frameState.viewState;
  const projection = viewState.projection;

  const tileLayer = /** @type {ol.layer.Tile} */ (this.getLayer());
  const tileSource = tileLayer.getSource();
  const tileGrid = tileSource.getTileGridForProjection(projection);
  const z = tileGrid.getZForResolution(viewState.resolution);
  const tileResolution = tileGrid.getResolution(z);

  const tilePixelSize =
      tileSource.getTilePixelSize(z, frameState.pixelRatio, projection);
  const pixelRatio = tilePixelSize[0] /
      _ol_size_.toSize(tileGrid.getTileSize(z), this.tmpSize_)[0];
  const tilePixelResolution = tileResolution / pixelRatio;
  const tileGutter = tileSource.getTilePixelRatio(pixelRatio) * tileSource.getGutter(projection);

  const center = viewState.center;
  const extent = frameState.extent;
  const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);

  let framebufferExtent;
  if (this.renderedTileRange_ &&
      this.renderedTileRange_.equals(tileRange) &&
      this.renderedRevision_ == tileSource.getRevision()) {
    framebufferExtent = this.renderedFramebufferExtent_;
  } else {

    const tileRangeSize = tileRange.getSize();

    const maxDimension = Math.max(
      tileRangeSize[0] * tilePixelSize[0],
      tileRangeSize[1] * tilePixelSize[1]);
    const framebufferDimension = roundUpToPowerOfTwo(maxDimension);
    const framebufferExtentDimension = tilePixelResolution * framebufferDimension;
    const origin = tileGrid.getOrigin(z);
    const minX = origin[0] +
        tileRange.minX * tilePixelSize[0] * tilePixelResolution;
    const minY = origin[1] +
        tileRange.minY * tilePixelSize[1] * tilePixelResolution;
    framebufferExtent = [
      minX, minY,
      minX + framebufferExtentDimension, minY + framebufferExtentDimension
    ];

    this.bindFramebuffer(frameState, framebufferDimension);
    gl.viewport(0, 0, framebufferDimension, framebufferDimension);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(_ol_webgl_.COLOR_BUFFER_BIT);
    gl.disable(_ol_webgl_.BLEND);

    const program = context.getProgram(this.fragmentShader_, this.vertexShader_);
    context.useProgram(program);
    if (!this.locations_) {
      this.locations_ = new _ol_renderer_webgl_tilelayershader_Locations_(gl, program);
    }

    context.bindBuffer(_ol_webgl_.ARRAY_BUFFER, this.renderArrayBuffer_);
    gl.enableVertexAttribArray(this.locations_.a_position);
    gl.vertexAttribPointer(
      this.locations_.a_position, 2, _ol_webgl_.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.locations_.a_texCoord);
    gl.vertexAttribPointer(
      this.locations_.a_texCoord, 2, _ol_webgl_.FLOAT, false, 16, 8);
    gl.uniform1i(this.locations_.u_texture, 0);

    /**
     * @type {Object.<number, Object.<string, ol.Tile>>}
     */
    const tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};

    const findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    let allTilesLoaded = true;
    const tmpExtent = createEmpty();
    const tmpTileRange = new TileRange(0, 0, 0, 0);
    let childTileRange, drawable, fullyLoaded, tile, tileState;
    let x, y, tileExtent;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

        tile = tileSource.getTile(z, x, y, pixelRatio, projection);
        if (layerState.extent !== undefined) {
          // ignore tiles outside layer extent
          tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
          if (!intersects(tileExtent, layerState.extent)) {
            continue;
          }
        }
        tileState = tile.getState();
        drawable = tileState == TileState.LOADED ||
            tileState == TileState.EMPTY ||
            tileState == TileState.ERROR && !useInterimTilesOnError;
        if (!drawable) {
          tile = tile.getInterimTile();
        }
        tileState = tile.getState();
        if (tileState == TileState.LOADED) {
          if (mapRenderer.isTileTextureLoaded(tile)) {
            tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
            continue;
          }
        } else if (tileState == TileState.EMPTY ||
                   (tileState == TileState.ERROR &&
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
    const zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(numberSafeCompareFunction);
    const u_tileOffset = new Float32Array(4);
    for (let i = 0, ii = zs.length; i < ii; ++i) {
      const tilesToDraw = tilesToDrawByZ[zs[i]];
      for (const tileKey in tilesToDraw) {
        tile = tilesToDraw[tileKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
        u_tileOffset[0] = 2 * (tileExtent[2] - tileExtent[0]) /
            framebufferExtentDimension;
        u_tileOffset[1] = 2 * (tileExtent[3] - tileExtent[1]) /
            framebufferExtentDimension;
        u_tileOffset[2] = 2 * (tileExtent[0] - framebufferExtent[0]) /
            framebufferExtentDimension - 1;
        u_tileOffset[3] = 2 * (tileExtent[1] - framebufferExtent[1]) /
            framebufferExtentDimension - 1;
        gl.uniform4fv(this.locations_.u_tileOffset, u_tileOffset);
        mapRenderer.bindTileTexture(tile, tilePixelSize,
          tileGutter * pixelRatio, _ol_webgl_.LINEAR, _ol_webgl_.LINEAR);
        gl.drawArrays(_ol_webgl_.TRIANGLE_STRIP, 0, 4);
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
  const tileTextureQueue = mapRenderer.getTileTextureQueue();
  this.manageTilePyramid(
    frameState, tileSource, tileGrid, pixelRatio, projection, extent, z,
    tileLayer.getPreload(),
    /**
       * @param {ol.Tile} tile Tile.
       */
    function(tile) {
      if (tile.getState() == TileState.LOADED &&
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

  const texCoordMatrix = this.texCoordMatrix;
  _ol_transform_.reset(texCoordMatrix);
  _ol_transform_.translate(texCoordMatrix,
    (Math.round(center[0] / tileResolution) * tileResolution - framebufferExtent[0]) /
          (framebufferExtent[2] - framebufferExtent[0]),
    (Math.round(center[1] / tileResolution) * tileResolution - framebufferExtent[1]) /
          (framebufferExtent[3] - framebufferExtent[1]));
  if (viewState.rotation !== 0) {
    _ol_transform_.rotate(texCoordMatrix, viewState.rotation);
  }
  _ol_transform_.scale(texCoordMatrix,
    frameState.size[0] * viewState.resolution /
          (framebufferExtent[2] - framebufferExtent[0]),
    frameState.size[1] * viewState.resolution /
          (framebufferExtent[3] - framebufferExtent[1]));
  _ol_transform_.translate(texCoordMatrix, -0.5, -0.5);

  return true;
};


/**
 * @inheritDoc
 */
WebGLTileLayerRenderer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  if (!this.framebuffer) {
    return undefined;
  }

  const pixelOnMapScaled = [
    pixel[0] / frameState.size[0],
    (frameState.size[1] - pixel[1]) / frameState.size[1]];

  const pixelOnFrameBufferScaled = _ol_transform_.apply(
    this.texCoordMatrix, pixelOnMapScaled.slice());
  const pixelOnFrameBuffer = [
    pixelOnFrameBufferScaled[0] * this.framebufferDimension,
    pixelOnFrameBufferScaled[1] * this.framebufferDimension];

  const gl = this.mapRenderer.getContext().getGL();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  const imageData = new Uint8Array(4);
  gl.readPixels(pixelOnFrameBuffer[0], pixelOnFrameBuffer[1], 1, 1,
    gl.RGBA, gl.UNSIGNED_BYTE, imageData);

  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer(), imageData);
  } else {
    return undefined;
  }
};
export default WebGLTileLayerRenderer;
