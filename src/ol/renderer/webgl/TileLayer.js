/**
 * @module ol/renderer/webgl/TileLayer
 */
import LRUCache from '../../structs/LRUCache.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLLayerRenderer from './Layer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {
  apply as applyTransform,
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../transform.js';
import {
  boundingExtent,
  containsCoordinate,
  getIntersection,
  isEmpty,
} from '../../extent.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import {
  createOrUpdate as createTileCoord,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import {fromUserExtent} from '../../proj.js';
import {getUid} from '../../util.js';
import {numberSafeCompareFunction} from '../../array.js';
import {toSize} from '../../size.js';

export const Uniforms = {
  TILE_TEXTURE_ARRAY: 'u_tileTextures',
  TILE_TRANSFORM: 'u_tileTransform',
  TRANSITION_ALPHA: 'u_transitionAlpha',
  DEPTH: 'u_depth',
  TEXTURE_PIXEL_WIDTH: 'u_texturePixelWidth',
  TEXTURE_PIXEL_HEIGHT: 'u_texturePixelHeight',
  TEXTURE_RESOLUTION: 'u_textureResolution', // map units per texture pixel
  TEXTURE_ORIGIN_X: 'u_textureOriginX', // map x coordinate of left edge of texture
  TEXTURE_ORIGIN_Y: 'u_textureOriginY', // map y coordinate of top edge of texture
  RENDER_EXTENT: 'u_renderExtent', // intersection of layer, source, and view extent
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
  const source = /** @type {import("../../source/Tile.js").default} */ (
    layerState.layer.getRenderSource()
  );
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

function getCacheKey(source, tileCoord) {
  return `${source.getKey()},${getTileCoordKey(tileCoord)}`;
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
     * The last call to `renderFrame` was completed with all tiles loaded
     * @type {boolean}
     */
    this.renderComplete = false;

    /**
     * This transform converts texture coordinates to screen coordinates.
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

    /**
     * @private
     * @type {import("../../PluggableMap.js").FrameState|null}
     */
    this.frameState_ = null;
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
    const source = layer.getRenderSource();
    if (!source) {
      return false;
    }

    if (isEmpty(getRenderExtent(frameState, frameState.extent))) {
      return false;
    }
    return source.getState() === 'ready';
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent The extent to be rendered.
   * @param {number} initialZ The zoom level.
   * @param {Object<number, Array<TileTexture>>} tileTexturesByZ The zoom level.
   */
  enqueueTiles(frameState, extent, initialZ, tileTexturesByZ) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);

    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }

    const wantedTiles = frameState.wantedTiles[tileSourceKey];

    const tileTextureCache = this.tileTextureCache_;
    const minZ = Math.max(
      initialZ - tileLayer.getPreload(),
      tileGrid.getMinZoom(),
      tileLayer.getMinZoom()
    );
    for (let z = initialZ; z >= minZ; --z) {
      const tileRange = tileGrid.getTileRangeForExtentAndZ(
        extent,
        z,
        this.tempTileRange_
      );

      const tileResolution = tileGrid.getResolution(z);

      for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
          const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
          const cacheKey = getCacheKey(tileSource, tileCoord);

          /** @type {TileTexture} */
          let tileTexture;

          /** @type {import("../../webgl/TileTexture").TileType} */
          let tile;

          if (tileTextureCache.containsKey(cacheKey)) {
            tileTexture = tileTextureCache.get(cacheKey);
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
              tileTexture = new TileTexture({
                tile: tile,
                grid: tileGrid,
                helper: this.helper,
                gutter: gutter,
              });
              tileTextureCache.set(cacheKey, tileTexture);
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
  }

  /**
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    this.frameState_ = frameState;
    this.renderComplete = true;
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);
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
      this.renderComplete = false;

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

      const tileWidthWithGutter = tileSize[0] + 2 * gutter;
      const tileHeightWithGutter = tileSize[1] + 2 * gutter;
      const aspectRatio = tileWidthWithGutter / tileHeightWithGutter;

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

        resetTransform(this.tileTransform_);
        scaleTransform(
          this.tileTransform_,
          2 / ((frameState.size[0] * tileScale) / tileWidthWithGutter),
          -2 / ((frameState.size[1] * tileScale) / tileWidthWithGutter)
        );
        rotateTransform(this.tileTransform_, viewState.rotation);
        scaleTransform(this.tileTransform_, 1, 1 / aspectRatio);
        translateTransform(
          this.tileTransform_,
          (tileSize[0] * (tileCenterI - centerI) - gutter) /
            tileWidthWithGutter,
          (tileSize[1] * (tileCenterJ - centerJ) - gutter) /
            tileHeightWithGutter
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
          tileWidthWithGutter
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_PIXEL_HEIGHT,
          tileHeightWithGutter
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_RESOLUTION,
          tileResolution
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_ORIGIN_X,
          tileOrigin[0] +
            tileCenterI * tileSize[0] * tileResolution -
            gutter * tileResolution
        );
        this.helper.setUniformFloatValue(
          Uniforms.TEXTURE_ORIGIN_Y,
          tileOrigin[1] -
            tileCenterJ * tileSize[1] * tileResolution +
            gutter * tileResolution
        );
        let gutterExtent = extent;
        if (gutter > 0) {
          gutterExtent = tileGrid.getTileCoordExtent(tileCoord);
          getIntersection(gutterExtent, extent, gutterExtent);
        }
        this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, gutterExtent);
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
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView} Data at the pixel location.
   */
  getData(pixel) {
    const gl = this.helper.getGL();
    if (!gl) {
      return null;
    }

    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    }

    const layer = this.getLayer();
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );

    const viewState = frameState.viewState;
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (
        !containsCoordinate(
          fromUserExtent(layerExtent, viewState.projection),
          coordinate
        )
      ) {
        return null;
      }
    }

    // determine last source suitable for rendering at coordinate
    const sources = layer.getSources(
      boundingExtent([coordinate]),
      viewState.resolution
    );
    let i, source, tileGrid;
    for (i = sources.length - 1; i >= 0; --i) {
      source = sources[i];
      if (source.getState() === 'ready') {
        tileGrid = source.getTileGridForProjection(viewState.projection);
        if (source.getWrapX()) {
          break;
        }
        const gridExtent = tileGrid.getExtent();
        if (!gridExtent || containsCoordinate(gridExtent, coordinate)) {
          break;
        }
      }
    }
    if (i < 0) {
      return null;
    }

    const tileTextureCache = this.tileTextureCache_;
    for (
      let z = tileGrid.getZForResolution(viewState.resolution);
      z >= tileGrid.getMinZoom();
      --z
    ) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      const cacheKey = getCacheKey(source, tileCoord);
      if (!tileTextureCache.containsKey(cacheKey)) {
        continue;
      }
      const tileTexture = tileTextureCache.get(cacheKey);
      if (!tileTexture.loaded) {
        continue;
      }
      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);

      const col =
        (coordinate[0] - tileOrigin[0]) / tileResolution -
        tileCoord[1] * tileSize[0];

      const row =
        (tileOrigin[1] - coordinate[1]) / tileResolution -
        tileCoord[2] * tileSize[1];

      return tileTexture.getPixelData(col, row);
    }
    return null;
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
    const source = this.getLayer().getRenderSource();
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, [altZ, x, y]);
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

  removeHelper() {
    if (this.helper) {
      const tileTextureCache = this.tileTextureCache_;
      tileTextureCache.forEach((tileTexture) => tileTexture.dispose());
      tileTextureCache.clear();
    }

    super.removeHelper();
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    const helper = this.helper;
    if (helper) {
      const gl = helper.getGL();
      gl.deleteProgram(this.program_);
      delete this.program_;

      helper.deleteBuffer(this.indices_);
    }

    super.disposeInternal();

    delete this.indices_;
    delete this.tileTextureCache_;
    delete this.frameState_;
  }
}

export default WebGLTileLayerRenderer;
