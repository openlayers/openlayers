
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import CustomCanvasVectorTileLayerRenderer from './mapbox-vector-tiles-custom-worker-render-layer';


export default class CustomVectorTileLayer extends VectorTileLayer {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.worker_ = opt_options.worker;
  }

  /**
   * Create a renderer for this layer.
   * @return {VectorTileRenderType} A layer renderer.
   * @protected
   */
  createRenderer() {
    return new CustomCanvasVectorTileLayerRenderer(this);
  }

  /**
   * @return {Worker} An optional worker.
   */
  getWorker() {
    return this.worker_;
  }
}
