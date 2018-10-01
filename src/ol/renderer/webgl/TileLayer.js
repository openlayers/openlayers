/**
 * @module ol/renderer/webgl/TileLayer
 */
// FIXME large resolutions lead to too large framebuffers :-(
// FIXME animated shaders! check in redraw

import LayerType from '../../LayerType.js';
import ImageTile from '../../ImageTile.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import TileSource from '../../source/Tile.js';
import {numberSafeCompareFunction} from '../../array.js';
import {createEmpty, intersects} from '../../extent.js';
import {roundUpToPowerOfTwo} from '../../math.js';
import WebGLLayerRenderer from '../webgl/Layer.js';
import {fragment, vertex} from '../webgl/tilelayershader.js';
import Locations from '../webgl/tilelayershader/Locations.js';
import {toSize} from '../../size.js';
import {
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
  apply as applyTransform
} from '../../transform.js';
import {COLOR_BUFFER_BIT, BLEND, ARRAY_BUFFER, FLOAT, LINEAR, TRIANGLE_STRIP} from '../../webgl.js';
import WebGLBuffer from '../../webgl/Buffer.js';

/**
 * @classdesc
 * WebGL renderer for tile layers.
 * @api
 */
class WebGLTileLayerRenderer extends WebGLLayerRenderer {

  /**
   * @param {import("./Map.js").default} mapRenderer Map renderer.
   * @param {import("../../layer/Tile.js").default} tileLayer Tile layer.
   */
  constructor(mapRenderer, tileLayer) {

    super(mapRenderer, tileLayer);

    /**
     * @private
     * @type {import("../../webgl/Fragment.js").default}
     */
    this.fragmentShader_ = fragment;

    /**
     * @private
     * @type {import("../../webgl/Vertex.js").default}
     */
    this.vertexShader_ = vertex;

    /**
     * @private
     * @type {import("./tilelayershader/Locations.js").default}
     */
    this.locations_ = null;

    /**
     * @private
     * @type {import("../../webgl/Buffer.js").default}
     */
    this.renderArrayBuffer_ = new WebGLBuffer([
      0, 0, 0, 1,
      1, 0, 1, 1,
      0, 1, 0, 0,
      1, 1, 1, 0
    ]);

    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.renderedTileRange_ = null;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.renderedFramebufferExtent_ = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = -1;

    /**
     * @private
     * @type {import("../../size.js").Size}
     */
    this.tmpSize_ = [0, 0];

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    const context = this.mapRenderer.getContext();
    context.deleteBuffer(this.renderArrayBuffer_);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  createLoadedTileFinder(source, projection, tiles) {
    const mapRenderer = this.mapRenderer;

    return (
      /**
       * @param {number} zoom Zoom level.
       * @param {import("../../TileRange.js").default} tileRange Tile range.
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
      }
    );
  }

  /**
   * @inheritDoc
   */
  handleWebGLContextLost() {
    super.handleWebGLContextLost();
    this.locations_ = null;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState, context) {

    const mapRenderer = this.mapRenderer;
    const gl = context.getGL();

    const viewState = frameState.viewState;
    const projection = viewState.projection;

    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = tileLayer.getSource();
    if (!(tileSource instanceof TileSource)) {
      return true;
    }

    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewState.resolution);
    const tileResolution = tileGrid.getResolution(z);

    const tilePixelSize =
        tileSource.getTilePixelSize(z, frameState.pixelRatio, projection);
    const pixelRatio = tilePixelSize[0] /
        toSize(tileGrid.getTileSize(z), this.tmpSize_)[0];
    const tilePixelResolution = tileResolution / pixelRatio;
    const tileGutter = tileSource.getTilePixelRatio(pixelRatio) * tileSource.getGutterForProjection(projection);

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
      gl.clear(COLOR_BUFFER_BIT);
      gl.disable(BLEND);

      const program = context.getProgram(this.fragmentShader_, this.vertexShader_);
      context.useProgram(program);
      if (!this.locations_) {
        this.locations_ = new Locations(gl, program);
      }

      context.bindBuffer(ARRAY_BUFFER, this.renderArrayBuffer_);
      gl.enableVertexAttribArray(this.locations_.a_position);
      gl.vertexAttribPointer(
        this.locations_.a_position, 2, FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(this.locations_.a_texCoord);
      gl.vertexAttribPointer(
        this.locations_.a_texCoord, 2, FLOAT, false, 16, 8);
      gl.uniform1i(this.locations_.u_texture, 0);

      /**
       * @type {Object<number, Object<string, import("../../Tile.js").default>>}
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

      /** @type {Array<number>} */
      const zs = Object.keys(tilesToDrawByZ).map(Number);
      zs.sort(numberSafeCompareFunction);
      const u_tileOffset = new Float32Array(4);
      for (let i = 0, ii = zs.length; i < ii; ++i) {
        const tilesToDraw = tilesToDrawByZ[zs[i]];
        for (const tileKey in tilesToDraw) {
          tile = tilesToDraw[tileKey];

          if (!(tile instanceof ImageTile)) {
            continue;
          }

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
            tileGutter * pixelRatio, LINEAR, LINEAR);
          gl.drawArrays(TRIANGLE_STRIP, 0, 4);
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
       * @param {import("../../Tile.js").default} tile Tile.
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
    resetTransform(texCoordMatrix);
    translateTransform(texCoordMatrix,
      (Math.round(center[0] / tileResolution) * tileResolution - framebufferExtent[0]) /
            (framebufferExtent[2] - framebufferExtent[0]),
      (Math.round(center[1] / tileResolution) * tileResolution - framebufferExtent[1]) /
            (framebufferExtent[3] - framebufferExtent[1]));
    if (viewState.rotation !== 0) {
      rotateTransform(texCoordMatrix, viewState.rotation);
    }
    scaleTransform(texCoordMatrix,
      frameState.size[0] * viewState.resolution /
            (framebufferExtent[2] - framebufferExtent[0]),
      frameState.size[1] * viewState.resolution /
            (framebufferExtent[3] - framebufferExtent[1]));
    translateTransform(texCoordMatrix, -0.5, -0.5);

    return true;
  }

  /**
   * @inheritDoc
   */
  forEachLayerAtPixel(pixel, frameState, callback, thisArg) {
    if (!this.framebuffer) {
      return undefined;
    }

    const pixelOnMapScaled = [
      pixel[0] / frameState.size[0],
      (frameState.size[1] - pixel[1]) / frameState.size[1]];

    const pixelOnFrameBufferScaled = applyTransform(
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
  }
}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLTileLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.TILE;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {WebGLTileLayerRenderer} The layer renderer.
 */
WebGLTileLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLTileLayerRenderer(
    /** @type {import("./Map.js").default} */ (mapRenderer),
    /** @type {import("../../layer/Tile.js").default} */ (layer)
  );
};


export default WebGLTileLayerRenderer;
