/**
 * @module ol/layer/WebGPUVector
 */
import WebGPUVectorLayerRenderer from '../renderer/webgpu/VectorLayer.js';
import Layer from './Layer.js';

/***
 * @template T
 * @typedef {T extends import("../source/Vector.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */

/**
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorSourceType>]
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
 * @property {VectorSourceType} [source] Source.
 * @property {import('../style/flat.js').FlatStyleLike|import('../style/Style.js').StyleLike} [style] Layer style. Nothing is rendered until a style is set. A style function
 * or `ol/style/Style` is supported for fills, strokes, circles and text; other image styles are drawn as plain discs.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables.
 * @property {boolean} [disableHitDetection=false] Disable hit detection.
 * @property {number} [hitTolerance=0] Hit-detection tolerance in pixels for the layer's feature events
 * (`featurehover`, `featureclick` and `featuresingleclick`).
 * @property {boolean|string|number} [declutter=false] Declutter group. Same-string groups are
 * shared among WebGPU layers only (not Canvas).
 * @property {import("../render.js").OrderFunction|null} [renderOrder] Feature render order.
 * The default is feature uid order, matching Canvas. Style `z-index` still paints
 * above that order.
 * @property {Object<string, *>} [properties] Observable properties.
 */

/**
 * @classdesc
 * Vector layer rendered with WebGPU. Requires `navigator.gpu`; there is no
 * silent fallback to Canvas or WebGL.
 *
 * **Important: a `WebGPUVector` layer must be manually disposed when removed.**
 *
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorSourceType>]
 * @extends {Layer<VectorSourceType, WebGPUVectorLayerRenderer>}
 */
class WebGPUVectorLayer extends Layer {
  /**
   * @param {Options<VectorSourceType, FeatureType>} [options] Options.
   */
  constructor(options) {
    options = /** @type {Options<VectorSourceType, FeatureType>} */ (
      options ? options : {}
    );
    const baseOptions = Object.assign({}, options);
    delete baseOptions.declutter;
    delete baseOptions.renderOrder;
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

    /**
     * @private
     * @type {import("../render.js").OrderFunction|null|undefined}
     */
    this.renderOrder_ = options.renderOrder;
  }

  /**
   * Features are read back from the GPU, so feature events arrive
   * asynchronously.
   * @return {boolean} `true`.
   * @override
   */
  hasAsyncFeatureQuery() {
    return true;
  }

  /**
   * @return {import("../render.js").OrderFunction|null|undefined} Render order.
   */
  getRenderOrder() {
    return this.renderOrder_;
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
    return new WebGPUVectorLayerRenderer(this, {
      style: this.style_,
      variables: this.styleVariables_,
      disableHitDetection: this.hitDetectionDisabled_,
      declutter: this.declutter_,
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

export default WebGPUVectorLayer;
