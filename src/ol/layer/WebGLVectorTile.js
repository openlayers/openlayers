/**
 * @module ol/layer/WebGLVectorTile
 */
import WebGLVectorTileLayerRenderer from '../renderer/webgl/VectorTileLayer.js';
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
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * FIXME: not supported yet
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (exclusive) below which this layer will
 * be visible.
 * @property {VectorTileSourceType} [source] Source.
 * @property {import('../style/flat.js').FlatStyleLike} style Layer style.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables. Each variable must hold a literal value (not
 * an expression). These variables can be used as {@link import("../expr/expression.js").ExpressionValue expressions} in the styles properties
 * using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLVector.js").default#updateStyleVariables} method.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * FIXME: not supported yet
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @classdesc
 * Layer optimized for rendering large vector datasets.
 *
 * **Important: a `WebGLVector` layer must be manually disposed when removed, otherwise the underlying WebGL context
 * will not be garbage collected.**
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
 * @extends {BaseTileLayer<VectorTileSourceType, WebGLVectorTileLayerRenderer>}
 */
class WebGLVectorTileLayer extends BaseTileLayer {
  /**
   * @param {Options<VectorTileSourceType, FeatureType>} [options] Options.
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
     */
    this.style_ = options.style;

    /**
     * @private
     */
    this.hitDetectionDisabled_ = !!options.disableHitDetection;
  }

  /**
   * @override
   */
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      style: this.style_,
      variables: this.styleVariables_,
      disableHitDetection: this.hitDetectionDisabled_,
      cacheSize: this.getCacheSize(),
    });
  }

  /**
   * Update any variables used by the layer style and trigger a re-render.
   * @param {import('../style/flat.js').StyleVariables} variables Variables to update.
   */
  updateStyleVariables(variables) {
    Object.assign(this.styleVariables_, variables);
    this.changed();
  }

  /**
   * Set the layer style.
   * @param {import('../style/flat.js').FlatStyleLike} style Layer style.
   */
  setStyle(style) {
    this.style_ = style;
    this.clearRenderer();
    this.changed();
  }
}

export default WebGLVectorTileLayer;
