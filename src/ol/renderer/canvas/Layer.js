/**
 * @module ol/renderer/canvas/Layer
 */
import {getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../../extent.js';
import {createCanvasContext2D} from '../../dom.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {rotateAtOffset} from '../../render/canvas.js';
import LayerRenderer from '../Layer.js';
import {create as createTransform, apply as applyTransform, compose as composeTransform} from '../../transform.js';

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
     * A temporary transform.  The values in this transform should only be used in a
     * function that sets the values.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.tempTransform_ = createTransform();

    /**
     * The transform for rendered pixels to viewport CSS pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.pixelTransform_ = createTransform();

    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.inversePixelTransform_ = createTransform();

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
   * @inheritDoc
   */
  disposeInternal() {
    this.context.canvas.width = this.context.canvas.height = 0;
    super.disposeInternal();
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
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent Clip extent.
   * @protected
   */
  clipUnrotated(context, frameState, extent) {
    const topLeft = getTopLeft(extent);
    const topRight = getTopRight(extent);
    const bottomRight = getBottomRight(extent);
    const bottomLeft = getBottomLeft(extent);

    applyTransform(frameState.coordinateToPixelTransform, topLeft);
    applyTransform(frameState.coordinateToPixelTransform, topRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomRight);
    applyTransform(frameState.coordinateToPixelTransform, bottomLeft);

    const inverted = this.inversePixelTransform_;
    applyTransform(inverted, topLeft);
    applyTransform(inverted, topRight);
    applyTransform(inverted, bottomRight);
    applyTransform(inverted, bottomLeft);

    context.save();
    context.beginPath();
    context.moveTo(Math.round(topLeft[0]), Math.round(topLeft[1]));
    context.lineTo(Math.round(topRight[0]), Math.round(topRight[1]));
    context.lineTo(Math.round(bottomRight[0]), Math.round(bottomRight[1]));
    context.lineTo(Math.round(bottomLeft[0]), Math.round(bottomLeft[1]));
    context.clip();
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchRenderEvent_(type, context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      const event = new RenderEvent(type, this.inversePixelTransform_, frameState, context, null);
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  preRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, context, frameState);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  postRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, context, frameState);
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
    const renderPixel = applyTransform(this.inversePixelTransform_, pixel.slice());
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
