/**
 * @module ol/layer/Image
 */
import {
  createLazyRenderer,
  getDefaultRenderer,
  lazyRenderer,
} from '../renderer.js';
import CanvasImageLayerRenderer from '../renderer/canvas/ImageLayer.js';
import BaseImageLayer from './BaseImage.js';

const webgpuRenderer = lazyRenderer(
  () => import('../renderer/webgpu/ImageLayer.js'),
);

/**
 * @template {import("../source/Image.js").default} ImageSourceType
 * @typedef {import("./BaseImage.js").Options<ImageSourceType> & ImageOptions} Options
 */

/**
 * @typedef {Object} ImageOptions
 * @property {import("../renderer.js").RendererName} [renderer] Renderer for this layer. Defaults to the one
 * set with {@link module:ol/renderer.setDefaultRenderer} when the layer is created.
 */

/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Image.js").default} ImageSourceType
 * @extends {BaseImageLayer<ImageSourceType, CanvasImageLayerRenderer|import("../renderer/webgpu/ImageLayer.js").default>}
 * @api
 */
class ImageLayer extends BaseImageLayer {
  /**
   * @param {Options<ImageSourceType>} [options] Layer options.
   */
  constructor(options) {
    options = options ? Object.assign({}, options) : {};
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
  }

  /**
   * @override
   */
  createRenderer() {
    if (this.rendererName === 'webgpu') {
      return createLazyRenderer(
        webgpuRenderer,
        (Renderer) => new Renderer(this),
      );
    }
    return new CanvasImageLayerRenderer(this);
  }

  /**
   * Get data for a pixel location.  A four element RGBA array will be returned.  For requests outside the
   * layer extent, `null` will be returned.  Data for an image can only be retrieved if the
   * source's `crossOrigin` property is set.
   *
   * ```js
   * // display layer data on every pointer move
   * map.on('pointermove', (event) => {
   *   console.log(layer.getData(event.pixel));
   * });
   * ```
   * @param {import("../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
   * @api
   * @override
   */
  getData(pixel) {
    return super.getData(pixel);
  }
}

export default ImageLayer;
