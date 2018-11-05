/**
 * @module ol/layer/WebGLVector
 */
import BaseVectorLayer from './BaseVector.js';
import WebGLVectorLayerRenderer from '../renderer/webgl/VectorLayer.js';


/**
 * @typedef {import("./BaseVector.js").Options} Options
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
class WebGLVectorLayer extends BaseVectorLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * Create a renderer for this layer.
   * @param {import("../renderer/webgl/Map.js").default} mapRenderer The map renderer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer(mapRenderer) {
    return new WebGLVectorLayerRenderer(mapRenderer, this);
  }
}


export default WebGLVectorLayer;
