/**
 * @module ol/layer/Vector
 */
import {
  createLazyRenderer,
  getDefaultRenderer,
  lazyRenderer,
} from '../renderer.js';
import BaseVectorLayer from './BaseVector.js';

const canvasRenderer = lazyRenderer(
  () => import('../renderer/canvas/VectorLayer.js'),
);
const webgpuRenderer = lazyRenderer(
  () => import('../renderer/webgpu/VectorLayer.js'),
);

/**
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the viewport extent used by the
 * renderer when getting features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * @property {VectorSourceType} [source] Source.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * @property {boolean|string|number} [declutter=false] Declutter images and text. Any truthy value will enable
 * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
 * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
 * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
 * layers or groups of layers separately, use different truthy values for `declutter`.
 * @property {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style. When set to `null`, only
 * features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
 * which will be used if this is not set.
 * @property {import("../renderer.js").RendererName} [renderer] Renderer for this layer. Defaults to the one
 * set with {@link module:ol/renderer.setDefaultRenderer} when the layer is created.
 * @property {import('../style/flat.js').StyleVariables} [variables] Variables for flat styles. WebGPU only.
 * @property {boolean} [disableHitDetection=false] Disable hit detection. WebGPU only.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {number} [hitTolerance=0] Hit-detection tolerance in pixels for the layer's feature events
 * (`featurehover`, `featureclick` and `featuresingleclick`).
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will
 * be recreated during animations. This means that no vectors will be shown clipped, but the
 * setting will have a performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will
 * be recreated during interactions. See also `updateWhileAnimating`.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @classdesc
 * Vector data is rendered client-side, as vectors. This layer type provides most accurate rendering
 * even during animations. Points and labels stay upright on rotated views. For very large
 * amounts of vector data, performance may suffer during pan and zoom animations. In this case,
 * try {@link module:ol/layer/VectorImage~VectorImageLayer}.
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @extends {BaseVectorLayer<FeatureType, VectorSourceType, import("../renderer/canvas/VectorLayer.js").default|import("../renderer/webgpu/VectorLayer.js").default>}
 * @api
 */
class VectorLayer extends BaseVectorLayer {
  /**
   * @param {Options<VectorSourceType, FeatureType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};
    const baseOptions = Object.assign({}, options);
    delete baseOptions.variables;
    delete baseOptions.disableHitDetection;
    const renderer = options.renderer;
    delete baseOptions.renderer;
    super(baseOptions);

    /**
     * The renderer, from the `renderer` option or `getDefaultRenderer()` at
     * construction.
     * @protected
     * @type {import("../renderer.js").RendererName}
     */
    this.rendererName = renderer ?? getDefaultRenderer();

    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = options.variables || {};

    /**
     * @private
     */
    this.hitDetectionDisabled_ = !!options.disableHitDetection;
  }

  /**
   * Features are read back from the GPU with WebGPU, so feature events arrive
   * asynchronously.
   * @return {boolean} Feature events are asynchronous.
   * @override
   */
  hasAsyncFeatureQuery() {
    return this.rendererName === 'webgpu';
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("./Layer.js").State} layerState Layer state.
   * @override
   */
  renderDeclutter(frameState, layerState) {
    if (this.rendererName !== 'webgpu') {
      super.renderDeclutter(frameState, layerState);
      return;
    }
    // WebGPU layers declutter on the GPU, among WebGPU layers only
    this.getRenderer()?.renderDeclutter(frameState, layerState);
  }

  /**
   * Update any variables used by the layer style and trigger a re-render. WebGPU only.
   * @param {import('../style/flat.js').StyleVariables} variables Variables to update.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
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
            style: this.getStyle() ?? undefined,
            variables: this.styleVariables_,
            disableHitDetection: this.hitDetectionDisabled_,
            declutter: this.getDeclutter(),
          }),
      );
    }
    return createLazyRenderer(canvasRenderer, (Renderer) => new Renderer(this));
  }
}

export default VectorLayer;
