/**
 * @module ol/layer/VectorTile
 */
import LayerType from '../LayerType.js';
import {assert} from '../asserts.js';
import TileProperty from '../layer/TileProperty.js';
import VectorLayer from '../layer/Vector.js';
import VectorTileRenderType from '../layer/VectorTileRenderType.js';
import {assign} from '../obj.js';


/**
 * @enum {string}
 * Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 * @api
 */
export const RenderType = {
  IMAGE: 'image',
  HYBRID: 'hybrid',
  VECTOR: 'vector'
};


/**
 * @typedef {Object} Options
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
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the tile extent used by the
 * renderer when getting features from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this value should match
 * the largest possible buffer of the used tiles. It should be at least the size of the largest
 * point symbol or line width.
 * @property {import("./VectorTileRenderType.js").default|string} [renderMode='hybrid'] Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but point symbols and texts
 *    are always rotated with the view and pixels are scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels are scaled during zoom
 *    animations. Point symbols and texts are accurately rendered as vectors and can stay upright on
 *    rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering even during
 *    animations, but slower performance than the other options.
 *
 * When `declutter` is set to `true`, `'hybrid'` will be used instead of `'image'`.
 * @property {import("../source/VectorTile.js").default} [source] Source.
 * @property {import("../PluggableMap.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link module:ol/Map#addLayer}.
 * @property {boolean} [declutter=false] Declutter images and text. Decluttering is applied to all
 * image and text styles, and the priority is defined by the z-index of the style. Lower z-index
 * means higher priority. When set to `true`, a `renderMode` of `'image'` will be overridden with
 * `'hybrid'`.
 * @property {import("../style/Style.js").StyleLike} [style] Layer style. See
 * {@link module:ol/style} for default style which will be used if this is not defined.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will be
 * recreated during animations. This means that no vectors will be shown clipped, but the setting
 * will have a performance impact for large amounts of vector data. When set to `false`, batches
 * will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will be
 * recreated during interactions. See also `updateWhileAnimating`.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created.
 * @property {import("../style/Style.js").StyleLike} [style] Layer style. See
 * {@link module:ol/style} for default style which will be used if this is not defined.
 * @property {boolean} [useInterimTilesOnError=true] Use interim tiles on error.
 */


/**
 * @classdesc
 * Layer for vector tile data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @param {Options=} opt_options Options.
 * @api
 */
class VectorTileLayer extends VectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    let renderMode = options.renderMode || VectorTileRenderType.HYBRID;
    assert(renderMode == undefined ||
       renderMode == VectorTileRenderType.IMAGE ||
       renderMode == VectorTileRenderType.HYBRID ||
       renderMode == VectorTileRenderType.VECTOR,
    28); // `renderMode` must be `'image'`, `'hybrid'` or `'vector'`
    if (options.declutter && renderMode == VectorTileRenderType.IMAGE) {
      renderMode = VectorTileRenderType.HYBRID;
    }
    options.renderMode = renderMode;

    const baseOptions = /** @type {Object} */ (assign({}, options));
    delete baseOptions.preload;
    delete baseOptions.useInterimTilesOnError;

    super(/** @type {import("./Vector.js").Options} */ (baseOptions));

    this.setPreload(options.preload ? options.preload : 0);
    this.setUseInterimTilesOnError(options.useInterimTilesOnError !== undefined ?
      options.useInterimTilesOnError : true);

    /**
    * The layer type.
    * @protected
    * @type {import("../LayerType.js").default}
    */
    this.type = LayerType.VECTOR_TILE;

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
  * Whether we use interim tiles on error.
  * @return {boolean} Use interim tiles on error.
  * @observable
  * @api
  */
  getUseInterimTilesOnError() {
    return /** @type {boolean} */ (this.get(TileProperty.USE_INTERIM_TILES_ON_ERROR));
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
  * Set whether we use interim tiles on error.
  * @param {boolean} useInterimTilesOnError Use interim tiles on error.
  * @observable
  * @api
  */
  setUseInterimTilesOnError(useInterimTilesOnError) {
    this.set(TileProperty.USE_INTERIM_TILES_ON_ERROR, useInterimTilesOnError);
  }
}


/**
 * Return the associated {@link module:ol/source/VectorTile vectortilesource} of the layer.
 * @function
 * @return {import("../source/VectorTile.js").default} Source.
 * @api
 */
VectorTileLayer.prototype.getSource;
export default VectorTileLayer;
