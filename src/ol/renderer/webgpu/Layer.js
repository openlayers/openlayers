/**
 * @module ol/renderer/webgpu/Layer
 */
import {asArray} from '../../color.js';
import {warn} from '../../console.js';
import LayerProperty from '../../layer/Property.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {
  addDeviceLostListener,
  getCurrentDevice,
  isWebGPUAvailable,
  removeDeviceLostListener,
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
     * A device request made by this renderer has not settled yet.
     * @private
     * @type {boolean}
     */
    this.deviceRequestPending_ = false;

    /**
     * The last device request failed. The next frame tries again, and only
     * the first failure in a row is reported.
     * @private
     * @type {boolean}
     */
    this.deviceRequestFailed_ = false;

    this.onMapChanged_ = () => {
      this.clearCache();
      this.removeHelper();
    };

    /**
     * Renders the layer again after the device is lost, so a replacement is
     * requested without waiting for something else to trigger a frame.
     * @private
     */
    this.onDeviceLost_ = () => {
      this.getLayer()?.changed();
    };

    layer.addChangeListener(LayerProperty.MAP, this.onMapChanged_);
    addDeviceLostListener(this.onDeviceLost_);
  }

  /**
   * Requests the shared device and renders the layer again once it is ready.
   * @private
   */
  requestDevice_() {
    if (this.deviceRequestPending_) {
      return;
    }
    this.deviceRequestPending_ = true;
    this.updateReady();
    requestDevice().then(
      () => {
        this.deviceRequestPending_ = false;
        this.deviceRequestFailed_ = false;
        this.updateReady();
        this.getLayer()?.changed();
      },
      (error) => {
        this.deviceRequestPending_ = false;
        this.updateReady();
        if (!this.deviceRequestFailed_) {
          warn(
            'WebGPU device request failed, retrying on the next frame:',
            error,
          );
        }
        this.deviceRequestFailed_ = true;
      },
    );
  }

  /**
   * Whether geometry is still being built off the main thread, or images it
   * needs are still loading.
   * @return {boolean} Work is pending.
   * @protected
   */
  hasPendingWork() {
    return false;
  }

  /**
   * Keeps the map from reporting `rendercomplete` while the device, the
   * geometry or the images for this layer are still on their way. Call it
   * whenever any of them changes.
   * @protected
   */
  updateReady() {
    this.ready = !this.deviceRequestPending_ && !this.hasPendingWork();
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
      this.requestDevice_();
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
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {string|undefined} Background color.
   * @protected
   */
  getBackground(frameState) {
    let background = this.getLayer().getBackground();
    if (typeof background === 'function') {
      background = background(frameState.viewState.resolution);
    }
    return background || undefined;
  }

  /**
   * Premultiplied RGBA in 0..1 for the frame clear. Translucent geometry is
   * blended in the render pass, so the clear has to be the layer background
   * rather than transparent black, which would composite those fills over white.
   * Layers share a canvas, so the layer opacity is in the color rather than on
   * the canvas.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {Array<number>|undefined} Clear color, or undefined for transparent.
   * @protected
   */
  getClearColor(frameState) {
    const background = this.getBackground(frameState);
    if (!background) {
      return undefined;
    }
    const color = asArray(background);
    const opacity = frameState.layerStatesArray[frameState.layerIndex].opacity;
    const alpha = (color[3] === undefined ? 1 : color[3]) * opacity;
    return [
      (color[0] / 255) * alpha,
      (color[1] / 255) * alpha,
      (color[2] / 255) * alpha,
      alpha,
    ];
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
    removeDeviceLostListener(this.onDeviceLost_);
    this.getLayer()?.removeChangeListener(
      LayerProperty.MAP,
      this.onMapChanged_,
    );
    super.disposeInternal();
  }
}

export default WebGPULayerRenderer;
