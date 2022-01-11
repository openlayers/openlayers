/**
 * @module ol/renderer/webgl/TileLayer
 */
import LRUCache from '../../structs/LRUCache.js';
import State from '../../source/State.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLLayerRenderer from './Layer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../transform.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {
  createOrUpdate as createTileCoord,
  getKeyZXY,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import {fromUserExtent} from '../../proj.js';
import {getIntersection} from '../../extent.js';
import {getUid} from '../../util.js';
import {isEmpty} from '../../extent.js';
import {numberSafeCompareFunction} from '../../array.js';
import {toSize} from '../../size.js';

export const Uniforms = {
  TILE_TEXTURE_ARRAY: 'u_tileTextures',
  TILE_TRANSFORM: 'u_tileTransform',
  TRANSITION_ALPHA: 'u_transitionAlpha',
  DEPTH: 'u_depth',
  TEXTURE_PIXEL_WIDTH: 'u_texturePixelWidth',
  TEXTURE_PIXEL_HEIGHT: 'u_texturePixelHeight',
  RESOLUTION: 'u_resolution',
  ZOOM: 'u_zoom',
};

export const Attributes = {
  TEXTURE_COORD: 'a_textureCoord',
};

/**
 * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
 */
const attributeDescriptions = [
  {
    name: Attributes.TEXTURE_COORD,
    size: 2,
    type: AttributeType.FLOAT,
  },
];

/**
 * @type {Object<string, boolean>}
 */
const empty = {};

/**
 * Transform a zoom level into a depth value ranging from -1 to 1.
 * @param {number} z A zoom level.
 * @return {number} A depth value.
 */
function depthForZ(z) {
  return 2 * (1 - 1 / (z + 1)) - 1;
}

/**
 * Add a tile texture to the lookup.
 * @param {Object<number, Array<import("../../webgl/TileTexture.js").default>>} tileTexturesByZ Lookup of
 * tile textures by zoom level.
 * @param {import("../../webgl/TileTexture.js").default} tileTexture A tile texture.
 * @param {number} z The zoom level.
 */
function addTileTextureToLookup(tileTexturesByZ, tileTexture, z) {
  if (!(z in tileTexturesByZ)) {
    tileTexturesByZ[z] = [];
  }
  tileTexturesByZ[z].push(tileTexture);
}

/**
 * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
 * @param {import("../../extent.js").Extent} extent The frame extent.
 * @return {import("../../extent.js").Extent} Frame extent intersected with layer extents.
 */
function getRenderExtent(frameState, extent) {
  const layerState = frameState.layerStatesArray[frameState.layerIndex];
  if (layerState.extent) {
    extent = getIntersection(
      extent,
      fromUserExtent(layerState.extent, frameState.viewState.projection)
    );
  }
  const source =
    /** {import("../../source/Tile.js").default} */ layerState.layer.getSource();
  if (!source.getWrapX()) {
    const gridExtent = source
      .getTileGridForProjection(frameState.viewState.projection)
      .getExtent();
    if (gridExtent) {
      extent = getIntersection(extent, gridExtent);
    }
  }
  return extent;
}

/**
 * @typedef {Object} Options
 * @property {string} vertexShader Vertex shader source.
 * @property {string} fragmentShader Fragment shader source.
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {Array<import("../../webgl/PaletteTexture.js").default>} [paletteTextures] Palette textures.
 * @property {number} [cacheSize=512] The texture cache size.
 */

/**
 * @typedef {import("../../layer/WebGLTile.js").default} LayerType
 */

/**
 * @classdesc
 * WebGL renderer for tile layers.
 * @extends {WebGLLayerRenderer<LayerType>}
 * @api
 */
class WebGLTileLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} options Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer, {
      uniforms: options.uniforms,
    });

    /**
     * This transform converts tile i, j coordinates to screen coordinates.
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.tileTransform_ = createTransform();

    /**
     * @type {Array<number>}
     * @private
     */
    this.tempMat4_ = createMat4();

    /**
     * @type {import("../../TileRange.js").default}
     * @private
     */
    this.tempTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @type {import("../../tilecoord.js").TileCoord}
     * @private
     */
    this.tempTileCoord_ = createTileCoord(0, 0, 0);

    /**
     * @type {import("../../size.js").Size}
     * @private
     */
    this.tempSize_ = [0, 0];

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.program_;

    /**
     * @private
     */
    this.vertexShader_ = options.vertexShader;

    /**
     * @private
     */
    this.fragmentShader_ = options.fragmentShader;

    /**
     * Tiles are rendered as a quad with the following structure:
     *
     *  [P3]---------[P2]
     *   |`           |
     *   |  `     B   |
     *   |    `       |
     *   |      `     |
     *   |   A    `   |
     *   |          ` |
     *  [P0]---------[P1]
     *
     * Triangle A: P0, P1, P3
     * Triangle B: P1, P2, P3
     *
     * @private
     */
    this.indices_ = new WebGLArrayBuffer(ELEMENT_ARRAY_BUFFER, STATIC_DRAW);
    this.indices_.fromArray([0, 1, 3, 1, 2, 3]);

    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 512;

    /**
     * @type {import("../../structs/LRUCache.js").default<import("../../webgl/TileTexture.js").default>}
     * @private
     */
    this.tileTextureCache_ = new LRUCache(cacheSize);

    /**
     * @type {Array<import("../../webgl/PaletteTexture.js").default>}
     * @private
     */
    this.paletteTextures_ = options.paletteTextures || [];
  }

  /**
   * @param {Options} options Options.
   */
  reset(options) {
    super.reset({
      uniforms: options.uniforms,
    });
    this.vertexShader_ = options.vertexShader;
    this.fragmentShader_ = options.fragmentShader;
    this.paletteTextures_ = options.paletteTextures || [];

    if (this.helper) {
      this.program_ = this.helper.getProgram(
        this.fragmentShader_,
        this.vertexShader_
      );
    }
  }

  afterHelperCreated() {
    this.program_ = this.helper.getProgram(
      this.fragmentShader_,
      this.vertexShader_
    );

    this.helper.flushBufferData(this.indices_);
  }

  /**
   * @param {import("../../webgl/TileTexture").TileType} tile Tile.
   * @return {boolean} Tile is drawable.
   * @private
   */
  isDrawableTile_(tile) {
    const tileLayer = this.getLayer();
    const tileState = tile.getState();
    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    return (
      tileState == TileState.LOADED ||
      tileState == TileState.EMPTY ||
      (tileState == TileState.ERROR && !useInterimTilesOnError)
    );
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrameInternal(frameState) {
    const layer = this.getLayer();
    const source = layer.getSource();
    if (!source) {
      return false;
    }

    if (isEmpty(getRenderExtent(frameState, frameState.extent))) {
      return false;
    }
    return source.getState() === State.READY;
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent The extent to be rendered.
   * @param {number} z The zoom level.
   * @param {Object<number, Array<TileTexture>>} tileTexturesByZ The zoom level.
   */
  enqueueTiles(frameState, extent, z, tileTexturesByZ) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const tileTextureCache = this.tileTextureCache_;
    const tileRange = tileGrid.getTileRangeForExtentAndZ(
      extent,
      z,
      this.tempTileRange_
    );

    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }

    const wantedTiles = frameState.wantedTiles[tileSourceKey];

    const tileResolution = tileGrid.getResolution(z);

    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
        const tileCoordKey = getTileCoordKey(tileCoord);

        /**
         * @type {TileTexture}
         */
        let tileTexture;

        /**
         * @type {import("../../webgl/TileTexture").TileType}
         */
        let tile;

        if (tileTextureCache.containsKey(tileCoordKey)) {
          tileTexture = tileTextureCache.get(tileCoordKey);
          tile = tileTexture.tile;
        }
        if (!tileTexture || tileTexture.tile.key !== tileSource.getKey()) {
          tile = tileSource.getTile(
            z,
            x,
            y,
            frameState.pixelRatio,
            viewState.projection
          );
          if (!tileTexture) {
            tileTexture = new TileTexture(tile, tileGrid, this.helper);
            tileTextureCache.set(tileCoordKey, tileTexture);
          } else {
            if (this.isDrawableTile_(tile)) {
              tileTexture.setTile(tile);
            } else {
              const interimTile =
                /** @type {import("../../webgl/TileTexture").TileType} */ (
                  tile.getInterimTile()
                );
              tileTexture.setTile(interimTile);
            }
          }
        }

        addTileTextureToLookup(tileTexturesByZ, tileTexture, z);

        const tileQueueKey = tile.getKey();
        wantedTiles[tileQueueKey] = true;

        if (tile.getState() === TileState.IDLE) {
          if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
            frameState.tileQueue.enqueue([
              tile,
              tileSourceKey,
              tileGrid.getTileCoordCenter(tileCoord),
              tileResolution,
            ]);
          }
        }
      }
    }
  }

  /**
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const extent = getRenderExtent(frameState, frameState.extent);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      tileSource.zDirection
    );

    /**
     * @type {Object<number, Array<import("../../webgl/TileTexture.js").default>>}
     */
    const tileTexturesByZ = {};

    if (frameState.nextExtent) {
      const targetZ = tileGrid.getZForResolution(
        viewState.nextResolution,
        tileSource.zDirection
      );
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      this.enqueueTiles(frameState, nextExtent, targetZ, tileTexturesByZ);
    }

    this.enqueueTiles(frameState, extent, z, tileTexturesByZ);

    /**
     * A lookup of alpha values for tiles at the target rendering resolution
     * for tiles that are in transition.  If a tile coord key is absent from
     * this lookup, the tile should be rendered at alpha 1.
     * @type {Object<string, number>}
     */
    const alphaLookup = {};

    const uid = getUid(this);
    const time = frameState.time;
    let blend = false;

    // look for cached tiles to use if a target tile is not ready
    const tileTextures = tileTexturesByZ[z];
    for (let i = 0, ii = tileTextures.length; i < ii; ++i) {
      const tileTexture = tileTextures[i];
      const tile = tileTexture.tile;
      const tileCoord = tile.tileCoord;

      if (tileTexture.loaded) {
        const alpha = tile.getAlpha(uid, time);
        if (alpha === 1) {
          // no need to look for alt tiles
          tile.endTransition(uid);
          continue;
        }
        blend = true;
        const tileCoordKey = getTileCoordKey(tileCoord);
        alphaLookup[tileCoordKey] = alpha;
      }

      // first look for child tiles (at z + 1)
      const coveredByChildren = this.findAltTiles_(
        tileGrid,
        tileCoord,
        z + 1,
        tileTexturesByZ
      );

      if (coveredByChildren) {
        continue;
      }

      // next look for parent tiles
      const minZoom = tileGrid.getMinZoom();
      for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
        const coveredByParent = this.findAltTiles_(
          tileGrid,
          tileCoord,
          parentZ,
          tileTexturesByZ
        );

        if (coveredByParent) {
          break;
        }
      }
    }

    this.helper.useProgram(this.program_);
    this.helper.prepareDraw(frameState, !blend);

    const zs = Object.keys(tileTexturesByZ)
      .map(Number)
      .sort(numberSafeCompareFunction);

    const centerX = viewState.center[0];
    const centerY = viewState.center[1];

    for (let j = 0, jj = zs.length; j < jj; ++j) {
      const tileZ = zs[j];
      const tileResolution = tileGrid.getResolution(tileZ);
      const tileSize = toSize(tileGrid.getTileSize(tileZ), this.tempSize_);
      const tileOrigin = tileGrid.getOrigin(tileZ);

      const centerI =
        (centerX - tileOrigin[0]) / (tileSize[0] * tileResolution);
      const centerJ =
        (tileOrigin[1] - centerY) / (tileSize[1] * tileResolution);

      const tileScale = viewState.resolution / tileResolution;

      const depth = depthForZ(tileZ);
      const tileTextures = tileTexturesByZ[tileZ];
      for (let i = 0, ii = tileTextures.length; i < ii; ++i) {
        const tileTexture = tileTextures[i];
        if (!tileTexture.loaded) {
          continue;
        }
        const tile = tileTexture.tile;
        const tileCoord = tile.tileCoord;
        const tileCoordKey = getTileCoordKey(tileCoord);

        const tileCenterI = tileCoord[1];
        const tileCenterJ = tileCoord[2];

        composeTransform(
          this.tileTransform_,
          0,
          0,
          2 / ((frameState.size[0] * tileScale) / tileSize[0]),
          -2 / ((frameState.size[1] * tileScale) / tileSize[1]),
          viewState.rotation,
          -(centerI - tileCenterI),
          -(centerJ - tileCenterJ)
        );

        this.helper.setUniformMatrixValue(
          Uniforms.TILE_TRANSFORM,
          mat4FromTransform(this.tempMat4_, this.tileTransform_)
        );

        this.helper.bindBuffer(tileTexture.coords);
        this.helper.bindBuffer(this.indices_);
        this.helper.enableAttributes(attributeDescriptions);

        let textureSlot = 0;
        while (textureSlot < tileTexture.textures.length) {
          const textureProperty = 'TEXTURE' + textureSlot;
          const uniformName = `${Uniforms.TILE_TEXTURE_ARRAY}[${textureSlot}]`;
          gl.activeTexture(gl[textureProperty]);
          gl.bindTexture(gl.TEXTURE_2D, tileTexture.textures[textureSlot]);
          gl.uniform1i(
            this.helper.getUniformLocation(uniformName),
            textureSlot
          );
          ++textureSlot;
        }

        for (
          let paletteIndex = 0;
          paletteIndex < this.paletteTextures_.length;
          ++paletteIndex
        ) {
          const paletteTexture = this.paletteTextures_[paletteIndex];
          gl.activeTexture(gl['TEXTURE' + textureSlot]);
          const texture = paletteTexture.getTexture(gl);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(
            this.helper.getUniformLocation(paletteTexture.name),
            textureSlot
          );
          ++textureSlot;
        }

        const alpha =
          tileCoordKey in alphaLookup ? alphaLookup[tileCoordKey] : 1;

        if (alpha < 1) {
          frameState.animate = true;
        }

        this.helper.setUniformFloatValue(Uniforms.TRANSITION_ALPHA, alpha);
        this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_PIXEL_WIDTH,
          tileSize[0]
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_PIXEL_HEIGHT,
          tileSize[1]
        );
        this.helper.setUniformFloatValue(
          Uniforms.RESOLUTION,
          viewState.resolution
        );
        this.helper.setUniformFloatValue(Uniforms.ZOOM, viewState.zoom);

        this.helper.drawElements(0, this.indices_.getSize());
      }
    }

    this.helper.finalizeDraw(
      frameState,
      this.dispatchPreComposeEvent,
      this.dispatchPostComposeEvent
    );

    const canvas = this.helper.getCanvas();

    const tileTextureCache = this.tileTextureCache_;
    while (tileTextureCache.canExpireCache()) {
      const tileTexture = tileTextureCache.pop();
      tileTexture.dispose();
    }

    // TODO: let the renderers manage their own cache instead of managing the source cache
    /**
     * Here we unconditionally expire the source cache since the renderer maintains
     * its own cache.
     * @param {import("../../PluggableMap.js").default} map Map.
     * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
     */
    const postRenderFunction = function (map, frameState) {
      tileSource.expireCache(frameState.viewState.projection, empty);
    };

    frameState.postRenderFunctions.push(postRenderFunction);

    this.postRender(gl, frameState);
    return canvas;
  }

  /**
   * Look for tiles covering the provided tile coordinate at an alternate
   * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
   * @param {number} altZ The alternate zoom level.
   * @param {Object<number, Array<import("../../webgl/TileTexture.js").default>>} tileTexturesByZ Lookup of
   * tile textures by zoom level.
   * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
   * @private
   */
  findAltTiles_(tileGrid, tileCoord, altZ, tileTexturesByZ) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_
    );

    if (!tileRange) {
      return false;
    }

    let covered = true;
    const tileTextureCache = this.tileTextureCache_;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getKeyZXY(altZ, x, y);
        let loaded = false;
        if (tileTextureCache.containsKey(cacheKey)) {
          const tileTexture = tileTextureCache.get(cacheKey);
          if (tileTexture.loaded) {
            addTileTextureToLookup(tileTexturesByZ, tileTexture, altZ);
            loaded = true;
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    const helper = this.helper;
    const gl = helper.getGL();

    helper.deleteBuffer(this.indices_);
    delete this.indices_;

    gl.deleteProgram(this.program_);
    delete this.program_;

    const tileTextureCache = this.tileTextureCache_;
    tileTextureCache.forEach(function (tileTexture) {
      tileTexture.dispose();
    });
    tileTextureCache.clear();
    delete this.tileTextureCache_;

    super.disposeInternal();
  }
}

/**
 * @function
 * @return {import("../../layer/WebGLTile.js").default}
 */
WebGLTileLayerRenderer.prototype.getLayer;

export default WebGLTileLayerRenderer;
