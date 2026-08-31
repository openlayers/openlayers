/**
 * @module ol/renderer/webgpu/Layer
 */
import LayerProperty from '../../layer/Property.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {
  getCurrentDevice,
  isWebGPUAvailable,
  requestDevice,
} from '../../webgpu/Device.js';
import WebGPUHelper from '../../webgpu/Helper.js';
import LayerRenderer from '../Layer.js';

/**
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
class WebGPULayerRenderer extends LayerRenderer {
  /**
   * @param {LayerType} layer Layer.
   */
  constructor(layer) {
    super(layer);

    /**
     * @type {WebGPUHelper|undefined}
     * @protected
     */
    this.helper;

    /**
     * @private
     * @type {boolean}
     */
    this.deviceRequested_ = false;

    this.onMapChanged_ = () => {
      this.clearCache();
      this.removeHelper();
    };

    layer.addChangeListener(LayerProperty.MAP, this.onMapChanged_);
  }

  /**
   * @protected
   */
  removeHelper() {
    if (this.helper) {
      this.helper.dispose();
      this.helper = undefined;
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrame(frameState) {
    if (!isWebGPUAvailable()) {
      throw new Error(
        'WebGPU is not available. Use a Canvas or WebGL layer instead.',
      );
    }
    if (!this.getLayer().getRenderSource()) {
      return false;
    }
    if (!getCurrentDevice()) {
      if (!this.deviceRequested_) {
        this.deviceRequested_ = true;
        requestDevice().then(
          () => {
            this.getLayer().changed();
          },
          () => {},
        );
      }
      return false;
    }

    let incrementGroup = true;
    let groupNumber = -1;
    let className;
    for (let i = 0, ii = frameState.layerStatesArray.length; i < ii; i++) {
      const layer = /** @type {import("../../layer/Layer.js").default} */ (
        frameState.layerStatesArray[i].layer
      );
      const renderer = layer.getRenderer();
      if (!(renderer instanceof WebGPULayerRenderer)) {
        incrementGroup = true;
        continue;
      }
      const layerClassName = layer.getClassName();
      if (incrementGroup || layerClassName !== className) {
        groupNumber += 1;
        incrementGroup = false;
      }
      className = layerClassName;
      if (renderer === this) {
        break;
      }
    }

    const canvasCacheKey = 'map/' + frameState.mapId + '/group/' + groupNumber;

    if (
      !this.helper ||
      !this.helper.canvasCacheKeyMatches(canvasCacheKey) ||
      this.helper.needsToBeRecreated()
    ) {
      this.removeHelper();
      this.helper = new WebGPUHelper({canvasCacheKey});
      if (className) {
        this.helper.getCanvas().className = className;
      }
      this.afterHelperCreated();
    }

    return this.prepareFrameInternal(frameState);
  }

  /**
   * @protected
   */
  afterHelperCreated() {}

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Ready.
   * @protected
   */
  prepareFrameInternal(frameState) {
    return true;
  }

  /**
   * @protected
   */
  clearCache() {}

  /**
   * @param {import("../../render/EventType.js").default} type Type.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchRenderEvent_(type, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const event = new RenderEvent(type, undefined, frameState);
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  preRender(frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, frameState);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  postRender(frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, frameState);
  }

  /**
   * @override
   */
  disposeInternal() {
    this.clearCache();
    this.removeHelper();
    this.getLayer()?.removeChangeListener(
      LayerProperty.MAP,
      this.onMapChanged_,
    );
    super.disposeInternal();
  }
}

export default WebGPULayerRenderer;
