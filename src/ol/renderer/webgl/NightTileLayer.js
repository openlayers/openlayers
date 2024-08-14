/**
 * @module ol/renderer/webgl/NightTileLayer
 */
import CompositeTile from '../../CompositeTile.js';
import CoordinateTileSource from '../../source/CoordinateTile.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLTileLayerRenderer, {Uniforms as BaseUniforms} from './TileLayer.js';
import {equivalent} from '../../proj.js';
import {getUid} from '../../util.js';

export const Uniforms = {
  ...BaseUniforms,
  COORDINATE_TEXTURE: 'u_coordinateTexture',
  SUBSOLAR_POSITION: 'u_subsolarPosition',
  TWILIGHT_STEPS: 'u_twilightSteps',
};

/**
 * @param {number} t Date
 * @return {Array<number>} Coordinate of the Subsolar position
 */
function getSubsolarPoint(t) {
  const N = Math.floor(
    (t - Date.UTC(new Date(t).getUTCFullYear(), 0, 0)) / 86400000,
  );

  const n = (2 * Math.PI) / 365.24;
  const declination = Math.asin(
    -0.39777249434045 *
      Math.cos(n * (N + 10) + 2 * 0.0167 * Math.sin(n * (N - 2))),
  );
  const latitude = (declination * 180) / Math.PI;

  const UTC_H =
    new Date(t).getUTCHours() +
    new Date(t).getUTCMinutes() / 60 +
    new Date(t).getUTCSeconds() / 3600;
  const longitude = 180 - UTC_H * 15;

  return [longitude, latitude];
}

/**
 * @typedef {Object} Options
 * @property {string} vertexShader Vertex shader source.
 * @property {string} fragmentShader Fragment shader source.
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {Array<import("../../webgl/PaletteTexture.js").default>} [paletteTextures] Palette textures.
 * @property {number} [cacheSize=512] The texture cache size.
 * @property {number} [twilightSteps=0] Twilight steps
 * @property {Date|number} [date] Date
 * @property {import("../../size.js").Size} [coordinateTileSize=[256,256]] Tile size for underlying CoordinateTileSource.
 */

/**
 * @typedef {import("../../layer/NightTile.js").default} LayerType
 */
/**
 * @typedef {import("../../webgl/TileTexture.js").TileType} TileType
 */
/**
 * @typedef {import("../../webgl/TileTexture.js").default} TileTextureRepresentation
 */
/**
 * @classdesc
 * WebGL renderer for night tile layers.
 * @template {import("../../source/Tile.js").default<TileType>} [SourceType=import("../../source/Tile.js").default<any>]
 * @extends {WebGLTileLayerRenderer<any>}
 * @api
 */
class WebGLNightTileLayerRenderer extends WebGLTileLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} options Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer, options);

    this.date_ = options.date ? new Date(options.date).getTime() : undefined;
    this.twilightSteps_ = options.twilightSteps ?? 0;

    /** @type {CoordinateTileSource} */
    this.coordinateTileSource_ = null;
    this.coordinateTileSize_ = options.coordinateTileSize;
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @override
   */
  prepareFrameInternal(frameState) {
    if (!super.prepareFrameInternal(frameState)) {
      return false;
    }

    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const tileLayer = /** @type {LayerType} */ (this.getLayer());
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);

    if (
      !this.coordinateTileSource_ ||
      !equivalent(this.coordinateTileSource_.getProjection(), projection) ||
      this.coordinateTileSource_.getPadding() !== gutter ||
      this.coordinateTileSource_.getTileGrid() !== tileGrid
    ) {
      this.coordinateTileSource_ = new CoordinateTileSource({
        projection,
        tileGrid,
        tileSize:
          this.coordinateTileSize_ ||
          tileGrid.getTileSize(frameState.viewState.zoom),
        padding: gutter,
        key: tileGrid ? getUid(tileGrid) : 'null',
      });
    }

    return true;
  }

  /**
   * @override
   * @param {import("../../webgl/BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
   */
  createTileRepresentation(options) {
    const baseTile = options.tile;

    const tileCoord = baseTile.getTileCoord();

    const coordTile = this.coordinateTileSource_.getTile(
      tileCoord[0],
      tileCoord[1],
      tileCoord[2],
      undefined,
      undefined,
    );

    return new TileTexture({
      tile: new CompositeTile({
        key: baseTile.key,
        tileCoord: baseTile.getTileCoord(),
        sourceTiles: [{tile: baseTile}, {tile: coordTile}],
      }),
      grid: options.grid,
      helper: options.helper,
      gutter: options.gutter,
    });
  }

  /**
   * @override
   * @param {TileTextureRepresentation} tileTexture Tile representation
   * @param {import("../../transform.js").Transform} tileTransform Tile transform
   * @param {import("../../Map.js").FrameState} frameState Frame state
   * @param {import("../../extent.js").Extent} renderExtent Render extent
   * @param {number} tileResolution Tile resolution
   * @param {import("../../size.js").Size} tileSize Tile size
   * @param {import("../../coordinate.js").Coordinate} tileOrigin Tile origin
   * @param {import("../../extent.js").Extent} tileExtent tile Extent
   * @param {number} depth Depth
   * @param {number} gutter Gutter
   * @param {number} alpha Alpha
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
    this.helper.addUniform(
      Uniforms.SUBSOLAR_POSITION,
      getSubsolarPoint(this.date_ ?? Date.now()),
    );

    this.helper.addUniform(Uniforms.TWILIGHT_STEPS, this.twilightSteps_);

    super.renderTile(
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
    );
  }

  /**
   * Set date
   * @param {number|undefined} date Date
   * @api
   */
  setDate(date) {
    this.date_ = date;
  }

  /**
   * Set twilight step
   * @param {number} steps Twilight steps
   * @api
   */
  setTwilightSteps(steps) {
    this.twilightSteps_ = steps;
  }
}

export default WebGLNightTileLayerRenderer;
