/**
 * @module ol/renderer/webgl/TileLayer
 */
import TileState from '../../TileState.js';
import {
  boundingExtent,
  containsCoordinate,
  getIntersection,
} from '../../extent.js';
import {fromUserExtent} from '../../proj.js';
import {toSize} from '../../size.js';
import {
  apply as applyTransform,
  reset as resetTransform,
  translate as translateTransform,
} from '../../transform.js';
import {fromTransform as mat4FromTransform} from '../../vec/mat4.js';
import {ELEMENT_ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLBaseTileLayerRenderer, {
  Uniforms as BaseUniforms,
  getCacheKey,
} from './TileLayerBase.js';

export const Uniforms = {
  ...BaseUniforms,
  TILE_TEXTURE_ARRAY: 'u_tileTextures',
  TEXTURE_PIXEL_WIDTH: 'u_texturePixelWidth',
  TEXTURE_PIXEL_HEIGHT: 'u_texturePixelHeight',
  TEXTURE_RESOLUTION: 'u_textureResolution', // map units per texture pixel
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
 * @property {Object<string, import("../../webgl/Helper.js").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {Array<import("../../webgl/PaletteTexture.js").default>} [paletteTextures] Palette textures.
 * @property {number} [cacheSize=512] The texture cache size.
 * @property {Array<import('./Layer.js').PostProcessesOptions>} [postProcesses] Post-processes definitions.
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
 * @template {import("../../layer/WebGLTile.js").default|import("../../layer/Flow.js").default} LayerType
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
     * @type {WebGLProgram|undefined}
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
     * @private
     * @type {WebGLArrayBuffer|undefined}
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
   * @override
   */
  reset(options) {
    super.reset(options);
    if (this.helper) {
      const gl = this.helper.getGL();
      for (const paletteTexture of this.paletteTextures_) {
        paletteTexture.delete(gl);
      }
    }

    this.vertexShader_ = options.vertexShader;
    this.fragmentShader_ = options.fragmentShader;
    this.paletteTextures_ = options.paletteTextures || [];

    if (this.helper) {
      this.program_ = this.helper.getProgram(
        this.fragmentShader_,
        this.vertexShader_,
      );
      const gl = this.helper.getGL();
      for (const paletteTexture of this.paletteTextures_) {
        // upload the texture data
        paletteTexture.getTexture(gl);
      }
    }
  }

  /**
   * @override
   */
  afterHelperCreated() {
    super.afterHelperCreated();

    const gl = this.helper.getGL();
    for (const paletteTexture of this.paletteTextures_) {
      // upload the texture data
      paletteTexture.getTexture(gl);
    }

    this.program_ = this.helper.getProgram(
      this.fragmentShader_,
      this.vertexShader_,
    );
    const indices = this.indices_;
    if (indices) {
      this.helper.flushBufferData(indices);
    }
  }

  /**
   * @override
   */
  removeHelper() {
    if (this.helper) {
      const gl = this.helper.getGL();
      for (const paletteTexture of this.paletteTextures_) {
        paletteTexture.delete(gl);
      }
    }

    super.removeHelper();
  }

  /**
   * @param {import("../../webgl/BaseTileRepresentation.js").TileRepresentationOptions<import("../../webgl/TileTexture.js").TileType>} options Tile representation options.
   * @override
   */
  createTileRepresentation(options) {
    return new TileTexture(options);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {boolean} tilesWithAlpha True if at least one of the rendered tiles has alpha.
   * @override
   */
  beforeTilesRender(frameState, tilesWithAlpha) {
    super.beforeTilesRender(frameState, tilesWithAlpha);
    const program = this.program_;
    if (program) {
      this.helper.useProgram(program, frameState);
    }
  }

  /**
   * @param {TileTextureRepresentation} tileTexture Tile texture.
   * @param {import("../../transform.js").Transform} tileTransform Tile transform.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} renderExtent Render extent.
   * @param {number} tileResolution Tile resolution.
   * @param {import("../../size.js").Size} tileSize Tile size.
   * @param {import("../../coordinate.js").Coordinate} tileOrigin Tile origin.
   * @param {import("../../extent.js").Extent} tileExtent Tile extent.
   * @param {number} depth Depth.
   * @param {number} gutter Gutter.
   * @param {number} alpha Alpha.
   * @override
   */
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
    alpha,
  ) {
    const gl = this.helper.getGL();
    this.helper.bindBuffer(tileTexture.coords);
    const tileIndices = this.indices_;
    if (tileIndices) {
      this.helper.bindBuffer(tileIndices);
    }
    this.helper.enableAttributes(attributeDescriptions);

    let textureSlot = 0;
    while (textureSlot < tileTexture.textures.length) {
      const uniformName = `${Uniforms.TILE_TEXTURE_ARRAY}[${textureSlot}]`;
      this.helper.bindTexture(
        tileTexture.textures[textureSlot],
        textureSlot,
        uniformName,
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
      mat4FromTransform(this.tmpMat4_, tileTransform),
    );

    this.helper.setUniformFloatValue(Uniforms.TRANSITION_ALPHA, alpha);
    this.helper.setUniformFloatValue(Uniforms.DEPTH, depth);

    let gutterExtent = renderExtent;
    if (gutter > 0) {
      gutterExtent = tileExtent;
      getIntersection(gutterExtent, renderExtent, gutterExtent);
    }
    const textureOriginX =
      tileOrigin[0] +
      tileCenterI * tileSize[0] * tileResolution -
      gutter * tileResolution;
    const textureOriginY =
      tileOrigin[1] -
      tileCenterJ * tileSize[1] * tileResolution +
      gutter * tileResolution;
    const extentTransform = translateTransform(
      resetTransform(this.tmpTransform_),
      -textureOriginX,
      -textureOriginY,
    );
    this.applyRenderExtentUniform(gutterExtent, extentTransform);

    this.helper.setUniformFloatValue(Uniforms.RESOLUTION, viewState.resolution);
    this.helper.setUniformFloatValue(Uniforms.ZOOM, viewState.zoom);

    this.helper.setUniformFloatValue(
      Uniforms.TEXTURE_PIXEL_WIDTH,
      tileWidthWithGutter,
    );
    this.helper.setUniformFloatValue(
      Uniforms.TEXTURE_PIXEL_HEIGHT,
      tileHeightWithGutter,
    );
    this.helper.setUniformFloatValue(
      Uniforms.TEXTURE_RESOLUTION,
      tileResolution,
    );

    const indices = this.indices_;
    if (indices) {
      this.helper.drawElements(0, indices.getSize());
    }
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Data at the pixel location.
   * @override
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
      pixel.slice(),
    );

    const viewState = frameState.viewState;
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (
        !containsCoordinate(
          fromUserExtent(layerExtent, viewState.projection),
          coordinate,
        )
      ) {
        return null;
      }
    }

    // determine last source suitable for rendering at coordinate
    const sources = layer.getSources(
      boundingExtent([coordinate]),
      viewState.resolution,
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
    if (i < 0 || !source || !tileGrid) {
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
      if (tile.getState() === TileState.EMPTY) {
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

      return tileTexture.getPixelData(col, row) ?? null;
    }
    return null;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    const helper = this.helper;
    if (helper) {
      const gl = helper.getGL();
      for (const paletteTexture of this.paletteTextures_) {
        paletteTexture.delete(gl);
      }
      this.paletteTextures_.length = 0;

      const program = this.program_;
      if (program) {
        gl.deleteProgram(program);
      }
      this.program_ = undefined;
      const indicesBuffer = this.indices_;
      if (indicesBuffer) {
        helper.deleteBuffer(indicesBuffer);
      }
      this.indices_ = undefined;
    }
    super.disposeInternal();
  }
}

export default WebGLTileLayerRenderer;
