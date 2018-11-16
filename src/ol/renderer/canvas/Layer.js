/**
 * @module ol/renderer/canvas/Layer
 */
import {getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../../extent.js';
import {createCanvasContext2D} from '../../dom.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {rotateAtOffset} from '../../render/canvas.js';
import LayerRenderer from '../Layer.js';
import {invert as invertTransform, create as createTransform, apply as applyTransform, compose as composeTransform} from '../../transform.js';

/**
 * @abstract
 */
class CanvasLayerRenderer extends LayerRenderer {

  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   */
  constructor(layer) {

    super(layer);

    /**
     * @protected
     * @type {number}
     */
    this.renderedResolution;

    /**
     * A temporary transform.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.tempTransform_ = createTransform();

    /**
     * The transform for rendered pixels to viewport CSS pixels.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.pixelTransform_ = createTransform();

    /**
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this.context = createCanvasContext2D();

    const canvas = this.context.canvas;
    canvas.style.position = 'absolute';
    canvas.style.transformOrigin = 'top left';
    canvas.className = this.getLayer().getClassName();
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent Clip extent.
   * @protected
   */
  clip(context, frameState, extent) {
    const pixelRatio = frameState.pixelRatio;
    const halfWidth = (frameState.size[0] * pixelRatio) / 2;
    const halfHeight = (frameState.size[1] * pixelRatio) / 2;
    const rotation = frameState.viewState.rotation;
    const topLeft = getTopLeft(extent);
    const topRight = getTopRight(extent);
    const bottomRight = getBottomRight(extent);
    const bottomLeft = getBottomLeft(extent);

    applyTransform(frameState.coordinateToPixelTransform, topLeft);
    applyTransform(frameState.coordinateToPixelTransform, topRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomLeft);

    context.save();
    rotateAtOffset(context, -rotation, halfWidth, halfHeight);
    context.beginPath();
    context.moveTo(topLeft[0] * pixelRatio, topLeft[1] * pixelRatio);
    context.lineTo(topRight[0] * pixelRatio, topRight[1] * pixelRatio);
    context.lineTo(bottomRight[0] * pixelRatio, bottomRight[1] * pixelRatio);
    context.lineTo(bottomLeft[0] * pixelRatio, bottomLeft[1] * pixelRatio);
    context.clip();
    rotateAtOffset(context, rotation, halfWidth, halfHeight);
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform} pixelTransform Transform.
   * @private
   */
  dispatchComposeEvent_(type, context, frameState, pixelTransform) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const composeEvent = new RenderEvent(type, pixelTransform, frameState,
        context, null);
      layer.dispatchEvent(composeEvent);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  preRender(context, frameState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.PRERENDER, context, frameState, opt_transform);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  postRender(context, frameState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.POSTRENDER, context, frameState, opt_transform);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../transform.js").Transform=} opt_transform Transform.
   * @protected
   */
  dispatchRenderEvent(context, frameState, opt_transform) {
    this.dispatchComposeEvent_(RenderEventType.RENDER, context, frameState, opt_transform);
  }

  /**
   * Creates a transform for rendering to an element that will be rotated after rendering.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} width Width of the rendered element (in pixels).
   * @param {number} height Height of the rendered element (in pixels).
   * @param {number} offsetX Offset on the x-axis in view coordinates.
   * @protected
   * @return {!import("../../transform.js").Transform} Transform.
   */
  getRenderTransform(frameState, width, height, offsetX) {
    const viewState = frameState.viewState;
    const pixelRatio = frameState.pixelRatio;
    const dx1 = width / 2;
    const dy1 = height / 2;
    const sx = pixelRatio / viewState.resolution;
    const sy = -sx;
    const dx2 = -viewState.center[0] + offsetX;
    const dy2 = -viewState.center[1];
    return composeTransform(this.tempTransform_, dx1, dy1, sx, sy, -viewState.rotation, dx2, dy2);
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @param {import("../../PluggableMap.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @return {Uint8ClampedArray|Uint8Array} The result.  If there is no data at the pixel
   *    location, null will be returned.  If there is data, but pixel values cannot be
   *    returned, and empty array will be returned.
   */
  getDataAtPixel(pixel, frameState, hitTolerance) {
    const renderPixel = applyTransform(invertTransform(this.pixelTransform_.slice()), pixel.slice());
    const context = this.context;

    let data;
    try {
      data = context.getImageData(Math.round(renderPixel[0]), Math.round(renderPixel[1]), 1, 1).data;
    } catch (err) {
      if (err.name === 'SecurityError') {
        // tainted canvas, we assume there is data at the given pixel (although there might not be)
        return new Uint8Array();
      }
      return data;
    }

    if (data[3] === 0) {
      return null;
    }
    return data;
  }

}

export default CanvasLayerRenderer;
