/**
 * @module ol/layer/WebGPUTile
 */
import WebGPUTileLayerRenderer from '../renderer/webgpu/TileLayer.js';
import BaseTileLayer from './BaseTile.js';

/**
 * @typedef {import("../source/DataTile.js").default<import("../DataTile.js").default|import("../ImageTile.js").default>|import("../source/Tile.js").default} SourceType
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.
 * @property {number} [zIndex] The z-index for layer rendering.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will be visible.
 * @property {number} [preload=0] Preload.
 * @property {SourceType} [source] Source.
 * @property {Array<SourceType>|function(import("../extent.js").Extent, number): Array<SourceType>} [sources] Sources. When a function is provided, it is called with the view extent and resolution and should return sources whose grids cover that extent.
 * @property {import("../Map.js").default} [map] Map overlay.
 * @property {number} [cacheSize=512] Texture cache size.
 * @property {import("../expr/wgsl.js").TileStyle} [style] Tile color style (expressions compiled to WGSL).
 * @property {Object<string, *>} [properties] Observable properties.
 */

/**
 * @classdesc
 * Layer for rendering raster tiles with WebGPU.
 *
 * **Important: a `WebGPUTile` layer must be manually disposed when removed.**
 *
 * WebGPU is required. There is no silent fallback to Canvas or WebGL.
 *
 * @extends {BaseTileLayer<SourceType, WebGPUTileLayerRenderer>}
 */
class WebGPUTileLayer extends BaseTileLayer {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};

    const style = options.style;
    delete options.style;

    /**
     * @type {(Array<SourceType>|function(import("../extent.js").Extent, number): Array<SourceType>)|undefined}
     */
    const sources = options.sources;
    delete options.sources;

    super(options);

    /**
     * @private
     * @type {import("../expr/wgsl.js").TileStyle|undefined}
     */
    this.style_ = style;

    /**
     * @private
     * @type {(Array<SourceType>|function(import("../extent.js").Extent, number): Array<SourceType>)|undefined}
     */
    this.sources_ = sources;

    /**
     * @private
     * @type {SourceType|null}
     */
    this.renderSource_ = null;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @return {Array<SourceType>} Sources.
   */
  getSources(extent, resolution) {
    const source = this.getSource();
    if (this.sources_) {
      return typeof this.sources_ === 'function'
        ? this.sources_(extent, resolution) || []
        : this.sources_;
    }
    return source ? [source] : [];
  }

  /**
   * @return {SourceType|null} The source being rendered.
   * @override
   */
  getRenderSource() {
    return this.renderSource_ || this.getSource();
  }

  /**
   * @param {SourceType|null} source Source for the current draw.
   */
  setRenderSource(source) {
    this.renderSource_ = source;
  }

  /**
   * @return {import("../source/Source.js").State} Source state.
   * @override
   */
  getSourceState() {
    const source = this.getRenderSource();
    return source ? source.getState() : 'undefined';
  }

  /**
   * @param {import("../expr/wgsl.js").TileStyle} style Style.
   */
  setStyle(style) {
    this.style_ = style;
    this.getRenderer()?.setStyle(style);
    this.changed();
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {Object<string, number|string>} variables Variables to update.
   * @api
   */
  updateStyleVariables(variables) {
    if (!this.style_) {
      this.style_ = {};
    }
    if (!this.style_.variables) {
      this.style_.variables = {};
    }
    Object.assign(this.style_.variables, variables);
    this.changed();
  }

  /**
   * @override
   */
  createRenderer() {
    return new WebGPUTileLayerRenderer(this, {
      cacheSize: this.getCacheSize(),
      style: this.style_,
    });
  }
}

export default WebGPUTileLayer;
