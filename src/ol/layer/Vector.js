/**
 * @module ol/layer/Vector
 */
import BaseVectorLayer from './BaseVector.js';
import CanvasVectorLayerRenderer from '../renderer/canvas/VectorLayer.js';

/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default} VectorSourceType
 * @extends {BaseVectorLayer<VectorSourceType>}
 * @api
 */
class VectorLayer extends BaseVectorLayer {
  /**
   * @param {import("./BaseVector.js").Options<VectorSourceType>} [opt_options] Options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   */
  createRenderer() {
    return new CanvasVectorLayerRenderer(this);
  }
}

export default VectorLayer;
