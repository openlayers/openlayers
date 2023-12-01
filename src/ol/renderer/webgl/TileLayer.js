/**
 * @module ol/renderer/webgl/TileLayer
 */
import ReprojDataTile from '../../reproj/DataTile.js';
import ReprojTile from '../../reproj/Tile.js';
import TileState from '../../TileState.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLBaseTileLayerRenderer, {
  Uniforms as BaseUniforms,
  getCacheKey,
} from './TileLayerBase.js';
import {AttributeType} from '../../webgl/Helper.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {apply as applyTransform} from '../../transform.js';
import {
  boundingExtent,
  containsCoordinate,
  getIntersection,
} from '../../extent.js';
import {fromUserExtent} from '../../proj.js';
import {fromTransform as mat4FromTransform} from '../../vec/mat4.js';
import {toSize} from '../../size.js';

export const Uniforms = {
  ...BaseUniforms,
  TILE_TEXTURE_ARRAY: 'u_tileTextures',
  TEXTURE_PIXEL_WIDTH: 'u_texturePixelWidth',
  TEXTURE_PIXEL_HEIGHT: 'u_texturePixelHeight',
  TEXTURE_RESOLUTION: 'u_textureResolution', // map units per texture pixel
  TEXTURE_ORIGIN_X: 'u_textureOriginX', // map x coordinate of left edge of texture
  TEXTURE_ORIGIN_Y: 'u_textureOriginY', // map y coordinate of top edge of texture
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
 * @typedef {import("../../webgl/TileTexture.js").TileType} TileTextureType
 */
/**
 * @typedef {import("../../webgl/TileTexture.js").default} TileTextureRepresentation
 */

/**
 * @classdesc
 * WebGL renderer for tile layers.
 * @extends {WebGLBaseTileLayerRenderer<LayerType, TileTextureType, TileTextureRepresentation>}
 * @api
 */
class WebGLTileLayerRenderer extends WebGLBaseTileLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} options Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer, options);

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
    super.reset(options);

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

  createTileRepresentation(options) {
    return new TileTexture(options);
  }

  beforeTilesRender(frameState, tilesWithAlpha) {
    super.beforeTilesRender(frameState, tilesWithAlpha);
    this.helper.useProgram(this.program_, frameState);
  }

  renderTile(
    tileTexture,
    tileTransform,
    frameState,
    renderExtent,
    tileResolution,
    tileSize,
    tileOrigin,
    tileExtent,
    depth,
    gutter,
    alpha
  ) {
    const gl = this.helper.getGL();
    this.helper.bindBuffer(tileTexture.coords);
    this.helper.bindBuffer(this.indices_);
    this.helper.enableAttributes(attributeDescriptions);

    let textureSlot = 0;
    while (textureSlot < tileTexture.textures.length) {
      const uniformName = `${Uniforms.TILE_TEXTURE_ARRAY}[${textureSlot}]`;
      this.helper.bindTexture(
        tileTexture.textures[textureSlot],
        textureSlot,
        uniformName
      );
      ++textureSlot;
    }

    for (
      let paletteIndex = 0;
      paletteIndex < this.paletteTextures_.length;
      ++paletteIndex
    ) {
      const paletteTexture = this.paletteTextures_[paletteIndex];
      const texture = paletteTexture.getTexture(gl);
      this.helper.bindTexture(texture, textureSlot, paletteTexture.name);
      ++textureSlot;
    }

    const viewState = frameState.viewState;

    const tileWidthWithGutter = tileSize[0] + 2 * gutter;
    const tileHeightWithGutter = tileSize[1] + 2 * gutter;

    const tile = tileTexture.tile;
    const tileCoord = tile.tileCoord;

    const tileCenterI = tileCoord[1];
    const tileCenterJ = tileCoord[2];

    this.helper.setUniformMatrixValue(
      Uniforms.TILE_TRANSFORM,
      mat4FromTransform(this.tempMat4, tileTransform)
    );

    this.helper.setUniformFloatValue(Uniforms.TRANSITION_ALPHA, alpha);
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);

    let gutterExtent = renderExtent;
    if (gutter > 0) {
      gutterExtent = tileExtent;
      getIntersection(gutterExtent, renderExtent, gutterExtent);
    }
    this.helper.setUniformFloatVec4(Uniforms.RENDER_EXTENT, gutterExtent);

    this.helper.setUniformFloatValue(Uniforms.RESOLUTION, viewState.resolution);
    this.helper.setUniformFloatValue(Uniforms.ZOOM, viewState.zoom);

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

    this.helper.drawElements(0, this.indices_.getSize());
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

    const frameState = this.frameState;
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

    const tileTextureCache = this.tileRepresentationCache;
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
      const tile = tileTexture.tile;
      if (
        (tile instanceof ReprojTile || tile instanceof ReprojDataTile) &&
        tile.getState() === TileState.EMPTY
      ) {
        return null;
      }
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
  }
}

export default WebGLTileLayerRenderer;
