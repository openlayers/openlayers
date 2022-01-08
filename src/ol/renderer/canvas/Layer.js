/**
 * @module ol/renderer/canvas/Layer
 */
import LayerRenderer from '../Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  create as createTransform,
} from '../../transform.js';
import {asArray} from '../../color.js';
import {
  containsCoordinate,
  getBottomLeft,
  getBottomRight,
  getTopLeft,
  getTopRight,
} from '../../extent.js';
import {createCanvasContext2D} from '../../dom.js';
import {equals} from '../../array.js';

/**
 * @abstract
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
class CanvasLayerRenderer extends LayerRenderer {
  /**
   * @param {LayerType} layer Layer.
   */
  constructor(layer) {
    super(layer);

    /**
     * @protected
     * @type {HTMLElement}
     */
    this.container = null;

    /**
     * @protected
     * @type {number}
     */
    this.renderedResolution;

    /**
     * A temporary transform.  The values in this transform should only be used in a
     * function that sets the values.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.tempTransform = createTransform();

    /**
     * The transform for rendered pixels to viewport CSS pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.pixelTransform = createTransform();

    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.inversePixelTransform = createTransform();

    /**
     * @type {CanvasRenderingContext2D}
     */
    this.context = null;

    /**
     * @type {boolean}
     */
    this.containerReused = false;

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.pixelContext_ = null;
  }

  /**
   * @param {import('../../PluggableMap.js').FrameState} frameState Frame state.
   * @return {string} Background color.
   */
  getBackground(frameState) {
    const layer = this.getLayer();
    let background = layer.getBackground();
    if (typeof background === 'function') {
      background = background(frameState.viewState.resolution);
    }
    return background || undefined;
  }

  /**
   * Get a rendering container from an existing target, if compatible.
   * @param {HTMLElement} target Potential render target.
   * @param {string} transform CSS Transform.
   * @param {number} opacity Opacity.
   * @param {string} [opt_backgroundColor] Background color.
   */
  useContainer(target, transform, opacity, opt_backgroundColor) {
    const layerClassName = this.getLayer().getClassName();
    let container, context;
    if (
      target &&
      target.className === layerClassName &&
      target.style.opacity === '' &&
      opacity === 1 &&
      (!opt_backgroundColor ||
        (target.style.backgroundColor &&
          equals(
            asArray(target.style.backgroundColor),
            asArray(opt_backgroundColor)
          )))
    ) {
      const canvas = target.firstElementChild;
      if (canvas instanceof HTMLCanvasElement) {
        context = canvas.getContext('2d');
      }
    }
    if (context && context.canvas.style.transform === transform) {
      // Container of the previous layer renderer can be used.
      this.container = target;
      this.context = context;
      this.containerReused = true;
    } else if (this.containerReused) {
      // Previously reused container cannot be used any more.
      this.container = null;
      this.context = null;
      this.containerReused = false;
    }
    if (!this.container) {
      container = document.createElement('div');
      container.className = layerClassName;
      let style = container.style;
      style.position = 'absolute';
      style.width = '100%';
      style.height = '100%';
      if (opt_backgroundColor) {
        style.backgroundColor = opt_backgroundColor;
      }
      context = createCanvasContext2D();
      const canvas = context.canvas;
      container.appendChild(canvas);
      style = canvas.style;
      style.position = 'absolute';
      style.left = '0';
      style.transformOrigin = 'top left';
      this.container = container;
      this.context = context;
    }
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

    const inverted = this.inversePixelTransform;
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
      const event = new RenderEvent(
        type,
        this.inversePixelTransform,
        frameState,
        context
      );
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
   * @param {import("../../coordinate.js").Coordinate} center Center.
   * @param {number} resolution Resolution.
   * @param {number} rotation Rotation.
   * @param {number} pixelRatio Pixel ratio.
   * @param {number} width Width of the rendered element (in pixels).
   * @param {number} height Height of the rendered element (in pixels).
   * @param {number} offsetX Offset on the x-axis in view coordinates.
   * @protected
   * @return {!import("../../transform.js").Transform} Transform.
   */
  getRenderTransform(
    center,
    resolution,
    rotation,
    pixelRatio,
    width,
    height,
    offsetX
  ) {
    const dx1 = width / 2;
    const dy1 = height / 2;
    const sx = pixelRatio / resolution;
    const sy = -sx;
    const dx2 = -center[0] + offsetX;
    const dy2 = -center[1];
    return composeTransform(
      this.tempTransform,
      dx1,
      dy1,
      sx,
      sy,
      -rotation,
      dx2,
      dy2
    );
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
    const renderPixel = applyTransform(
      this.inversePixelTransform,
      pixel.slice()
    );
    const context = this.context;

    const layer = this.getLayer();
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      const renderCoordinate = applyTransform(
        frameState.pixelToCoordinateTransform,
        pixel.slice()
      );

      /** get only data inside of the layer extent */
      if (!containsCoordinate(layerExtent, renderCoordinate)) {
        return null;
      }
    }

    const x = Math.round(renderPixel[0]);
    const y = Math.round(renderPixel[1]);
    let pixelContext = this.pixelContext_;
    if (!pixelContext) {
      const pixelCanvas = document.createElement('canvas');
      pixelCanvas.width = 1;
      pixelCanvas.height = 1;
      pixelContext = pixelCanvas.getContext('2d');
      this.pixelContext_ = pixelContext;
    }
    pixelContext.clearRect(0, 0, 1, 1);
    let data;
    try {
      pixelContext.drawImage(context.canvas, x, y, 1, 1, 0, 0, 1, 1);
      data = pixelContext.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      if (err.name === 'SecurityError') {
        // tainted canvas, we assume there is data at the given pixel (although there might not be)
        this.pixelContext_ = null;
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
