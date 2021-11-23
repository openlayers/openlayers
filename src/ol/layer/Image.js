/**
 * @module ol/layer/Image
 */
import BaseImageLayer from './BaseImage.js';
import CanvasImageLayerRenderer from '../renderer/canvas/ImageLayer.js';

/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Image.js").default} ImageSourceType
 * @extends {BaseImageLayer<ImageSourceType, CanvasImageLayerRenderer>}
 * @api
 */
class ImageLayer extends BaseImageLayer {
  /**
   * @param {import("./BaseImage.js").Options<ImageSourceType>} [opt_options] Layer options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  createRenderer() {
    return new CanvasImageLayerRenderer(this);
  }
}

export default ImageLayer;
