/**
 * @module ol/layer/VectorImage
 */
import BaseVectorLayer from './BaseVector.js';
import {assign} from '../obj.js';
import CanvasVectorImageLayerRenderer from '../renderer/canvas/VectorImageLayer.js';

/**
 * @typedef {import("./BaseVector.js").Options} Options
 * @property {number} [imageRatio=1] Ratio by which the rendered extent should be larger than the
 * viewport extent. A larger ratio avoids cut images during panning, but will cause a decrease in performance.
 */


/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @api
 */
class VectorImageLayer extends BaseVectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : /** @type {Options} */ ({});

    const baseOptions = assign({}, options);
    delete baseOptions.imageRatio;
    super(baseOptions);

    /**
     * @type {number}
     * @private
     */
    this.imageRatio_ = options.imageRatio !== undefined ? options.imageRatio : 1;

  }

  /**
   * @return {number} Ratio between rendered extent size and viewport extent size.
   */
  getImageRatio() {
    return this.imageRatio_;
  }

  /**
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer() {
    return new CanvasVectorImageLayerRenderer(this);
  }
}


export default VectorImageLayer;
