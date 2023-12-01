/**
 * @module ol/renderer/webgl/Layer
 */
import LayerProperty from '../../layer/Property.js';
import LayerRenderer from '../Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import WebGLHelper from '../../webgl/Helper.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../transform.js';

/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas that will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Base WebGL renderer class.
 * Holds all logic related to data manipulation & some common rendering logic
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
class WebGLLayerRenderer extends LayerRenderer {
  /**
   * @param {LayerType} layer Layer.
   * @param {Options} [options] Options.
   */
  constructor(layer, options) {
    super(layer);

    options = options || {};

    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform is only
     * set before dispatching rendering events.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.inversePixelTransform_ = createTransform();

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.pixelContext_ = null;

    /**
     * @private
     */
    this.postProcesses_ = options.postProcesses;

    /**
     * @private
     */
    this.uniforms_ = options.uniforms;

    /**
     * @type {WebGLHelper}
     * @protected
     */
    this.helper;

    layer.addChangeListener(LayerProperty.MAP, this.removeHelper.bind(this));

    this.dispatchPreComposeEvent = this.dispatchPreComposeEvent.bind(this);
    this.dispatchPostComposeEvent = this.dispatchPostComposeEvent.bind(this);
  }

  /**
   * @param {WebGLRenderingContext} context The WebGL rendering context.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  dispatchPreComposeEvent(context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.PRECOMPOSE)) {
      const event = new RenderEvent(
        RenderEventType.PRECOMPOSE,
        undefined,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {WebGLRenderingContext} context The WebGL rendering context.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  dispatchPostComposeEvent(context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.POSTCOMPOSE)) {
      const event = new RenderEvent(
        RenderEventType.POSTCOMPOSE,
        undefined,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * Reset options (only handles uniforms).
   * @param {Options} options Options.
   */
  reset(options) {
    this.uniforms_ = options.uniforms;
    if (this.helper) {
      this.helper.setUniforms(this.uniforms_);
    }
  }

  /**
   * @protected
   */
  removeHelper() {
    if (this.helper) {
      this.helper.dispose();
      delete this.helper;
    }
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    if (this.getLayer().getRenderSource()) {
      let incrementGroup = true;
      let groupNumber = -1;
      let className;
      for (let i = 0, ii = frameState.layerStatesArray.length; i < ii; i++) {
        const layer = frameState.layerStatesArray[i].layer;
        const renderer = layer.getRenderer();
        if (!(renderer instanceof WebGLLayerRenderer)) {
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

      const canvasCacheKey =
        'map/' + frameState.mapId + '/group/' + groupNumber;

      if (
        !this.helper ||
        !this.helper.canvasCacheKeyMatches(canvasCacheKey) ||
        this.helper.needsToBeRecreated()
      ) {
        this.removeHelper();

        this.helper = new WebGLHelper({
          postProcesses: this.postProcesses_,
          uniforms: this.uniforms_,
          canvasCacheKey: canvasCacheKey,
        });

        if (className) {
          this.helper.getCanvas().className = className;
        }

        this.afterHelperCreated();
      }
    }

    return this.prepareFrameInternal(frameState);
  }

  /**
   * @protected
   */
  afterHelperCreated() {}

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @protected
   */
  prepareFrameInternal(frameState) {
    return true;
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.removeHelper();
    super.disposeInternal();
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchRenderEvent_(type, context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      composeTransform(
        this.inversePixelTransform_,
        0,
        0,
        frameState.pixelRatio,
        -frameState.pixelRatio,
        0,
        0,
        -frameState.size[1]
      );

      const event = new RenderEvent(
        type,
        this.inversePixelTransform_,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  preRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, context, frameState);
  }

  /**
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  postRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, context, frameState);
  }
}

export default WebGLLayerRenderer;
