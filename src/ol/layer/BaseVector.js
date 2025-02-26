/**
 * @module ol/layer/BaseVector
 */
import RBush from 'rbush';
import {
  flatStylesToStyleFunction,
  rulesToStyleFunction,
} from '../render/canvas/style.js';
import Style, {
  createDefaultStyle,
  toFunction as toStyleFunction,
} from '../style/Style.js';
import Layer from './Layer.js';

/***
 * @template T
 * @typedef {T extends import("../source/Vector.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */

/**
 * @template {import('../Feature').FeatureLike} FeatureType
 * @template {import("../source/Vector.js").default<FeatureType>|import("../source/VectorTile.js").default<FeatureType>} VectorSourceType<FeatureType>
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
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will
 * be recreated during animations. This means that no vectors will be shown clipped, but the
 * setting will have a performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will
 * be recreated during interactions. See also `updateWhileAnimating`.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @enum {string}
 * @private
 */
const Property = {
  RENDER_ORDER: 'renderOrder',
};

/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import('../Feature').FeatureLike} FeatureType
 * @template {import("../source/Vector.js").default<FeatureType>|import("../source/VectorTile.js").default<FeatureType>} VectorSourceType<FeatureType>
 * @extends {Layer<VectorSourceType, RendererType>}
 * @template {import("../renderer/canvas/VectorLayer.js").default|import("../renderer/canvas/VectorTileLayer.js").default|import("../renderer/canvas/VectorImageLayer.js").default|import("../renderer/webgl/VectorLayer.js").default|import("../renderer/webgl/PointsLayer.js").default} RendererType
 * @api
 */
class BaseVectorLayer extends Layer {
  /**
   * @param {Options<FeatureType, VectorSourceType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign({}, options);

    delete baseOptions.style;
    delete baseOptions.renderBuffer;
    delete baseOptions.updateWhileAnimating;
    delete baseOptions.updateWhileInteracting;
    super(baseOptions);

    /**
     * @private
     * @type {string}
     */
    this.declutter_ = options.declutter ? String(options.declutter) : undefined;

    /**
     * @type {number}
     * @private
     */
    this.renderBuffer_ =
      options.renderBuffer !== undefined ? options.renderBuffer : 100;

    /**
     * User provided style.
     * @type {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike}
     * @private
     */
    this.style_ = null;

    /**
     * Style function for use within the library.
     * @type {import("../style/Style.js").StyleFunction|undefined}
     * @private
     */
    this.styleFunction_ = undefined;

    this.setStyle(options.style);

    /**
     * @type {boolean}
     * @private
     */
    this.updateWhileAnimating_ =
      options.updateWhileAnimating !== undefined
        ? options.updateWhileAnimating
        : false;

    /**
     * @type {boolean}
     * @private
     */
    this.updateWhileInteracting_ =
      options.updateWhileInteracting !== undefined
        ? options.updateWhileInteracting
        : false;
  }

  /**
   * @return {string} Declutter group.
   * @override
   */
  getDeclutter() {
    return this.declutter_;
  }

  /**
   * Get the topmost feature that intersects the given pixel on the viewport. Returns a promise
   * that resolves with an array of features. The array will either contain the topmost feature
   * when a hit was detected, or it will be empty.
   *
   * The hit detection algorithm used for this method is optimized for performance, but is less
   * accurate than the one used in [map.getFeaturesAtPixel()]{@link import("../Map.js").default#getFeaturesAtPixel}.
   * Text is not considered, and icons are only represented by their bounding box instead of the exact
   * image.
   *
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with an array of features.
   * @api
   * @override
   */
  getFeatures(pixel) {
    return super.getFeatures(pixel);
  }

  /**
   * @return {number|undefined} Render buffer.
   */
  getRenderBuffer() {
    return this.renderBuffer_;
  }

  /**
   * @return {import("../render.js").OrderFunction|null|undefined} Render order.
   */
  getRenderOrder() {
    return /** @type {import("../render.js").OrderFunction|null|undefined} */ (
      this.get(Property.RENDER_ORDER)
    );
  }

  /**
   * Get the style for features.  This returns whatever was passed to the `style`
   * option at construction or to the `setStyle` method.
   * @return {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null|undefined} Layer style.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Get the style function.
   * @return {import("../style/Style.js").StyleFunction|undefined} Layer style function.
   * @api
   */
  getStyleFunction() {
    return this.styleFunction_;
  }

  /**
   * @return {boolean} Whether the rendered layer should be updated while
   *     animating.
   */
  getUpdateWhileAnimating() {
    return this.updateWhileAnimating_;
  }

  /**
   * @return {boolean} Whether the rendered layer should be updated while
   *     interacting.
   */
  getUpdateWhileInteracting() {
    return this.updateWhileInteracting_;
  }

  /**
   * Render declutter items for this layer
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("../layer/Layer.js").State} layerState Layer state.
   * @override
   */
  renderDeclutter(frameState, layerState) {
    const declutterGroup = this.getDeclutter();
    if (declutterGroup in frameState.declutter === false) {
      frameState.declutter[declutterGroup] = new RBush(9);
    }
    this.getRenderer().renderDeclutter(frameState, layerState);
  }

  /**
   * @param {import("../render.js").OrderFunction|null|undefined} renderOrder
   *     Render order.
   */
  setRenderOrder(renderOrder) {
    this.set(Property.RENDER_ORDER, renderOrder);
  }

  /**
   * Set the style for features.  This can be a single style object, an array
   * of styles, or a function that takes a feature and resolution and returns
   * an array of styles. If set to `null`, the layer has no style (a `null` style),
   * so only features that have their own styles will be rendered in the layer. Call
   * `setStyle()` without arguments to reset to the default style. See
   * [the ol/style/Style module]{@link module:ol/style/Style~Style} for information on the default style.
   *
   * If your layer has a static style, you can use [flat style]{@link module:ol/style/flat~FlatStyle} object
   * literals instead of using the `Style` and symbolizer constructors (`Fill`, `Stroke`, etc.):
   * ```js
   * vectorLayer.setStyle({
   *   "fill-color": "yellow",
   *   "stroke-color": "black",
   *   "stroke-width": 4
   * })
   * ```
   *
   * @param {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style.
   * @api
   */
  setStyle(style) {
    this.style_ = style === undefined ? createDefaultStyle : style;
    const styleLike = toStyleLike(style);
    this.styleFunction_ =
      style === null ? undefined : toStyleFunction(styleLike);
    this.changed();
  }

  /**
   * @param {boolean|string|number} declutter Declutter images and text.
   * @api
   */
  setDeclutter(declutter) {
    this.declutter_ = declutter ? String(declutter) : undefined;
    this.changed();
  }
}

/**
 * Coerce the allowed style types into a shorter list of types.  Flat styles, arrays of flat
 * styles, and arrays of rules are converted into style functions.
 *
 * @param {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style.
 * @return {import("../style/Style.js").StyleLike|null} The style.
 */
function toStyleLike(style) {
  if (style === undefined) {
    return createDefaultStyle;
  }
  if (!style) {
    return null;
  }
  if (typeof style === 'function') {
    return style;
  }
  if (style instanceof Style) {
    return style;
  }
  if (!Array.isArray(style)) {
    return flatStylesToStyleFunction([style]);
  }
  if (style.length === 0) {
    return [];
  }

  const length = style.length;
  const first = style[0];

  if (first instanceof Style) {
    /**
     * @type {Array<Style>}
     */
    const styles = new Array(length);
    for (let i = 0; i < length; ++i) {
      const candidate = style[i];
      if (!(candidate instanceof Style)) {
        throw new Error('Expected a list of style instances');
      }
      styles[i] = candidate;
    }
    return styles;
  }

  if ('style' in first) {
    /**
     * @type {Array<import("../style/flat.js").Rule>}
     */
    const rules = new Array(length);
    for (let i = 0; i < length; ++i) {
      const candidate = style[i];
      if (!('style' in candidate)) {
        throw new Error('Expected a list of rules with a style property');
      }
      rules[i] = candidate;
    }
    return rulesToStyleFunction(rules);
  }

  const flatStyles =
    /** @type {Array<import("../style/flat.js").FlatStyle>} */ (style);
  return flatStylesToStyleFunction(flatStyles);
}

export default BaseVectorLayer;
