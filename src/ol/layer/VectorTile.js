/**
 * @module ol/layer/VectorTile
 */
import BaseVectorLayer from './BaseVector.js';
import CanvasVectorTileLayerRenderer from '../renderer/canvas/VectorTileLayer.js';
import TileProperty from './TileProperty.js';
import {assert} from '../asserts.js';

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|
 *     import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError'|import("../render/EventType").LayerRenderEventTypes, Return>} VectorTileLayerOnSignature
 */

/**
 * @typedef {'hybrid' | 'vector'} VectorTileRenderType
 */

/***
 * @template T
 * @typedef {T extends import("../source/VectorTile.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */

/**
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import("../Feature").FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
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
 * @property {number} [renderBuffer=100] The buffer in pixels around the tile extent used by the
 * renderer when getting features from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this value should match
 * the largest possible buffer of the used tiles. It should be at least the size of the largest
 * point symbol or line width.
 * @property {VectorTileRenderType} [renderMode='hybrid'] Render mode for vector tiles:
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels are scaled during zoom
 *    animations. Point symbols and texts are accurately rendered as vectors and can stay upright on
 *    rotated views, but get lifted above all polygon and line elements.
 *  * `'vector'`: Everything is rendered as vectors and the original render order is maintained. Use
 *    this mode for improved performance and visual epxerience on vector tile layers with not too many
 *    rendered features (e.g. for highlighting a subset of features of another layer with the same
 *    source).
 * @property {VectorTileSourceType} [source] Source.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * @property {boolean|string|number} [declutter=false] Declutter images and text. Any truthy value will enable
 * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
 * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
 * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
 * layers or groups of layers separately, use different truthy values for `declutter`.
 * @property {import("../style/Style.js").StyleLike|null} [style] Layer style. When set to `null`, only
 * features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
 * which will be used if this is not set.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no
 * background will be rendered.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will be
 * recreated during animations. This means that no vectors will be shown clipped, but the setting
 * will have a performance impact for large amounts of vector data. When set to `false`, batches
 * will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will be
 * recreated during interactions. See also `updateWhileAnimating`.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {boolean} [useInterimTilesOnError=true] Deprecated.  Use interim tiles on error.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 * @property {number} [cacheSize=0] The internal tile cache size.  If too small, this will auto-grow to hold
 * two zoom levels worth of tiles.
 */

/**
 * @classdesc
 * Layer for vector tile data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import("../Feature.js").FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
 * @extends {BaseVectorLayer<FeatureType, VectorTileSourceType, CanvasVectorTileLayerRenderer>}
 * @api
 */
class VectorTileLayer extends BaseVectorLayer {
  /**
   * @param {Options<VectorTileSourceType, FeatureType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    const baseOptions = Object.assign({}, options);
    delete baseOptions.preload;
    const cacheSize = options.cacheSize === undefined ? 0 : options.cacheSize;
    delete options.cacheSize;
    delete baseOptions.useInterimTilesOnError;

    super(baseOptions);

    /***
     * @type {VectorTileLayerOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {VectorTileLayerOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {VectorTileLayerOnSignature<void>}
     */
    this.un;

    /**
     * @type {number|undefined}
     * @private
     */
    this.cacheSize_ = cacheSize;

    const renderMode = options.renderMode || 'hybrid';
    assert(
      renderMode == 'hybrid' || renderMode == 'vector',
      "`renderMode` must be `'hybrid'` or `'vector'`",
    );

    /**
     * @private
     * @type {VectorTileRenderType}
     */
    this.renderMode_ = renderMode;

    this.setPreload(options.preload ? options.preload : 0);
    this.setUseInterimTilesOnError(
      options.useInterimTilesOnError !== undefined
        ? options.useInterimTilesOnError
        : true,
    );

    /**
     * @return {import("./Base.js").BackgroundColor} Background color.
     * @function
     * @api
     */
    this.getBackground;

    /**
     * @param {import("./Base.js").BackgroundColor} background Background color.
     * @function
     * @api
     */
    this.setBackground;
  }

  /**
   * @override
   */
  createRenderer() {
    return new CanvasVectorTileLayerRenderer(this, {
      cacheSize: this.cacheSize_,
    });
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
   * Get features whose bounding box intersects the provided extent. Only features for cached
   * tiles for the last rendered zoom level are available in the source. So this method is only
   * suitable for requesting tiles for extents that are currently rendered.
   *
   * Features are returned in random tile order and as they are included in the tiles. This means
   * they can be clipped, duplicated across tiles, and simplified to the render resolution.
   *
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {Array<FeatureType>} Features.
   * @api
   */
  getFeaturesInExtent(extent) {
    return /** @type {Array<FeatureType>} */ (
      /** @type {*} */ (this.getRenderer().getFeaturesInExtent(extent))
    );
  }

  /**
   * @return {VectorTileRenderType} The render mode.
   */
  getRenderMode() {
    return this.renderMode_;
  }

  /**
   * Return the level as number to which we will preload tiles up to.
   * @return {number} The level to preload tiles up to.
   * @observable
   * @api
   */
  getPreload() {
    return /** @type {number} */ (this.get(TileProperty.PRELOAD));
  }

  /**
   * Deprecated.  Whether we use interim tiles on error.
   * @return {boolean} Use interim tiles on error.
   * @observable
   * @api
   */
  getUseInterimTilesOnError() {
    return /** @type {boolean} */ (
      this.get(TileProperty.USE_INTERIM_TILES_ON_ERROR)
    );
  }

  /**
   * Set the level as number to which we will preload tiles up to.
   * @param {number} preload The level to preload tiles up to.
   * @observable
   * @api
   */
  setPreload(preload) {
    this.set(TileProperty.PRELOAD, preload);
  }

  /**
   * Deprecated.  Set whether we use interim tiles on error.
   * @param {boolean} useInterimTilesOnError Use interim tiles on error.
   * @observable
   * @api
   */
  setUseInterimTilesOnError(useInterimTilesOnError) {
    this.set(TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
  }
}

export default VectorTileLayer;
