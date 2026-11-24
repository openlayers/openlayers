/**
 * @module ol/layer/Tile
 */
import {
  createLazyRenderer,
  getDefaultRenderer,
  lazyRenderer,
} from '../renderer.js';
import BaseTileLayer from './BaseTile.js';

const canvasRenderer = lazyRenderer(
  () => import('../renderer/canvas/TileLayer.js'),
);
const webgpuRenderer = lazyRenderer(
  () => import('../renderer/webgpu/TileLayer.js'),
);

/**
 * @template {import("../source/Tile.js").default} TileSourceType
 * @typedef {import("./BaseTile.js").Options<TileSourceType> & TileOptions<TileSourceType>} Options
 */

/**
 * @template {import("../source/Tile.js").default} TileSourceType
 * @typedef {Object} TileOptions
 * @property {import("../renderer.js").RendererName} [renderer] Renderer for this layer. Defaults to the one
 * set with {@link module:ol/renderer.setDefaultRenderer} when the layer is created.
 * @property {Array<TileSourceType>|function(import("../extent.js").Extent, number): Array<TileSourceType>} [sources] Sources,
 * in place of `source`. When a function is provided, it is called with the view extent and resolution and should
 * return sources whose grids cover that extent. WebGPU only.
 * @property {import("../expr/wgsl.js").TileStyle} [style] Tile color style. WebGPU only.
 */

/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Tile.js").default} [TileSourceType=import("../source/Tile.js").default]
 * @extends BaseTileLayer<TileSourceType, import("../renderer/canvas/TileLayer.js").default|import("../renderer/webgpu/TileLayer.js").default>
 * @api
 */
class TileLayer extends BaseTileLayer {
  /**
   * @param {Options<TileSourceType>} [options] Tile layer options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};

    const style = options.style;
    delete options.style;

    const sources = options.sources;
    delete options.sources;

    const renderer = options.renderer;
    delete options.renderer;

    super(options);

    /**
     * The renderer, from the `renderer` option or `getDefaultRenderer()` at
     * construction.
     * @protected
     * @type {import("../renderer.js").RendererName}
     */
    this.rendererName = renderer ?? getDefaultRenderer();

    /**
     * @private
     * @type {import("../expr/wgsl.js").TileStyle|undefined}
     */
    this.style_ = style;

    /**
     * @private
     * @type {undefined|Array<TileSourceType>|function(import("../extent.js").Extent, number): Array<TileSourceType>}
     */
    this.sources_ = sources;

    /**
     * @private
     * @type {TileSourceType|null}
     */
    this.renderSource_ = null;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @return {Array<TileSourceType>} Sources.
   */
  getSources(extent, resolution) {
    if (this.sources_) {
      return typeof this.sources_ === 'function'
        ? this.sources_(extent, resolution) || []
        : this.sources_;
    }
    const source = this.getSource();
    return source ? [source] : [];
  }

  /**
   * @return {TileSourceType|null} The source being rendered.
   * @override
   */
  getRenderSource() {
    return this.renderSource_ || this.getSource();
  }

  /**
   * @param {TileSourceType|null} source Source for the current draw.
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
   * Get the tile color style. WebGPU only.
   * @return {import("../expr/wgsl.js").TileStyle|undefined} Style.
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Set the tile color style. WebGPU only.
   * @param {import("../expr/wgsl.js").TileStyle} style Style.
   */
  setStyle(style) {
    this.style_ = style;
    this.styleChanged();
  }

  /**
   * Update any variables used by the layer style and trigger a re-render. WebGPU only.
   * @param {Object<string, number|string>} variables Variables to update.
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
    if (this.rendererName === 'webgpu') {
      return createLazyRenderer(
        webgpuRenderer,
        (Renderer) =>
          new Renderer(this, {
            cacheSize: this.getCacheSize(),
            style: this.style_,
          }),
      );
    }
    return createLazyRenderer(
      canvasRenderer,
      (Renderer) => new Renderer(this, {cacheSize: this.getCacheSize()}),
    );
  }
}

export default TileLayer;
