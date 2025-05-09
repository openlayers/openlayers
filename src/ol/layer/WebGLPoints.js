/**
 * @module ol/layer/WebGLPoints
 */
import {parseLiteralStyle} from '../render/webgl/style.js';
import WebGLPointsLayerRenderer from '../renderer/webgl/PointsLayer.js';
import Layer from './Layer.js';

/**
 * @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>} VectorSourceType
 * @typedef {Object} Options
 * @property {import('../style/flat.js').FlatStyle} style Literal style to apply to the layer features.
 * @property {import("../expr/expression.js").EncodedExpression} [filter] The filter used
 * to determine if a style applies. If no filter is included, the rule always applies.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables. Each variable must hold a literal value (not
 * an expression). These variables can be used as {@link import("../expr/expression.js").ExpressionValue expressions} in the styles properties
 * using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLPoints.js").default#updateStyleVariables} method.
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
 * @property {VectorSourceType} [source] Point source.
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @classdesc
 * Layer optimized for rendering large point datasets. Takes a `style` property which
 * is a serializable JSON object describing how the layer should be rendered.
 *
 * Here are a few samples of literal style objects:
 * ```js
 * const style = {
 *   'circle-radius': 8,
 *   'circle-fill-color': '#33AAFF',
 *   'circle-opacity': 0.9
 * }
 * ```
 *
 * ```js
 * const style = {
 *   'icon-src': '../static/exclamation-mark.png',
 *   'icon-offset': [0, 12],
 *   'icon-width': 4,
 *   'icon-height': 8
 * }
 * ```
 *
 * **Important: a `WebGLPoints` layer must be manually disposed when removed, otherwise the underlying WebGL context
 * will not be garbage collected.**
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>} VectorSourceType
 * @extends {Layer<VectorSourceType, WebGLPointsLayerRenderer>}
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @deprecated Use ol/layer/WebGLVector instead
 */
class WebGLPointsLayer extends Layer {
  /**
   * @param {Options<VectorSourceType>} options Options.
   */
  constructor(options) {
    const baseOptions = Object.assign({}, options);

    super(baseOptions);

    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    this.styleVariables_ = options.variables || {};

    /**
     * @private
     * @type {import('../render/webgl/style.js').StyleParseResult}
     */
    this.parseResult_ = parseLiteralStyle(
      options.style,
      this.styleVariables_,
      options.filter,
    );

    /**
     * @private
     * @type {boolean}
     */
    this.hitDetectionDisabled_ = !!options.disableHitDetection;
  }

  /**
   * @override
   */
  createRenderer() {
    const attributes = Object.keys(this.parseResult_.attributes).map(
      (name) => ({
        name,
        ...this.parseResult_.attributes[name],
      }),
    );
    return new WebGLPointsLayerRenderer(this, {
      vertexShader: this.parseResult_.builder.getSymbolVertexShader(),
      fragmentShader: this.parseResult_.builder.getSymbolFragmentShader(),
      hitDetectionEnabled: !this.hitDetectionDisabled_,
      uniforms: this.parseResult_.uniforms,
      attributes:
        /** @type {Array<import('../renderer/webgl/PointsLayer.js').CustomAttribute>} */ (
          attributes
        ),
    });
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {Object<string, number>} variables Variables to update.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }
}

export default WebGLPointsLayer;
