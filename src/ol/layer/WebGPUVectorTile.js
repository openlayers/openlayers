/**
 * @module ol/layer/WebGPUVectorTile
 */
import WebGPUVectorTileLayerRenderer from '../renderer/webgpu/VectorTileLayer.js';
import BaseTileLayer from './BaseTile.js';

/***
 * @template T
 * @typedef {T extends import("../source/Vector.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */

/**
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
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
 * @property {VectorTileSourceType} [source] Source.
 * @property {import('../style/flat.js').FlatStyleLike|import('../style/Style.js').StyleLike} [style] Layer style. Nothing is rendered until a style is set. A style function
 * or `ol/style/Style` is supported for fills, strokes, circles and text; other image styles are drawn as plain discs.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables.
 * @property {boolean} [disableHitDetection=false] Disable hit detection.
 * @property {boolean|string|number} [declutter=false] Declutter group shared among WebGPU layers.
 * @property {number} [cacheSize=512] Maximum number of cached tiles. The GPU memory used by cached
 * tiles is also limited, but always leaves room for twice what the visible tiles need.
 * @property {Object<string, *>} [properties] Observable properties.
 */

/**
 * @classdesc
 * Vector tile layer rendered with WebGPU. Labels from adjacent tiles share a
 * map-level declutter group so they do not overlap at tile boundaries.
 *
 * **Important: a `WebGPUVectorTile` layer must be manually disposed when removed.**
 *
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
 * @extends {BaseTileLayer<VectorTileSourceType, WebGPUVectorTileLayerRenderer>}
 */
class WebGPUVectorTileLayer extends BaseTileLayer {
  /**
   * @param {Options<VectorTileSourceType, FeatureType>} [options] Options.
   */
  constructor(options) {
    options = /** @type {Options<VectorTileSourceType, FeatureType>} */ (
      options ? options : {}
    );
    const baseOptions = Object.assign({}, options);
    delete baseOptions.declutter;
    super(baseOptions);

    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = options.variables || {};

    /**
     * @private
     */
    this.style_ = options.style;

    /**
     * @private
     */
    this.hitDetectionDisabled_ = !!options.disableHitDetection;

    /**
     * @private
     * @type {string|undefined}
     */
    this.declutter_ = options.declutter ? String(options.declutter) : undefined;
  }

  /**
   * @return {string|undefined} Declutter group.
   * @override
   */
  getDeclutter() {
    return this.declutter_;
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("./Layer.js").State} layerState Layer state.
   * @override
   */
  renderDeclutter(frameState, layerState) {
    const renderer = this.getRenderer();
    if (renderer) {
      renderer.renderDeclutter(frameState, layerState);
    }
  }

  /**
   * @override
   */
  createRenderer() {
    return new WebGPUVectorTileLayerRenderer(this, {
      style: this.style_,
      variables: this.styleVariables_,
      disableHitDetection: this.hitDetectionDisabled_,
      declutter: this.declutter_,
      cacheSize: this.getCacheSize(),
    });
  }

  /**
   * @param {import('../style/flat.js').StyleVariables} variables Variables.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }

  /**
   * @return {import('../style/flat.js').FlatStyleLike|import('../style/Style.js').StyleLike|undefined} Layer style.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * @param {import('../style/flat.js').FlatStyleLike|import('../style/Style.js').StyleLike} style Style.
   */
  setStyle(style) {
    this.style_ = style;
    this.clearRenderer();
    this.changed();
  }
}

export default WebGPUVectorTileLayer;
