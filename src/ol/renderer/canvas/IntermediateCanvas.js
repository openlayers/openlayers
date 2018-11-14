/**
 * @module ol/renderer/canvas/IntermediateCanvas
 */
import {abstract} from '../../util.js';
import {scale as scaleCoordinate} from '../../coordinate.js';
import {createCanvasContext2D} from '../../dom.js';
import {containsExtent, intersects} from '../../extent.js';
import CanvasLayerRenderer from './Layer.js';
import {create as createTransform, apply as applyTransform} from '../../transform.js';

/**
 * @abstract
 */
class IntermediateCanvasRenderer extends CanvasLayerRenderer {

  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {boolean=} opt_noContext Skip the context creation.
   */
  constructor(layer, opt_noContext) {

    super(layer);

    /**
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this.context = opt_noContext ? null : createCanvasContext2D();

    /**
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.coordinateToCanvasPixelTransform = createTransform();

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.hitCanvasContext_ = null;

    /**
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this.layerContext = createCanvasContext2D();

    const canvas = this.layerContext.canvas;
    canvas.style.position = 'absolute';
    canvas.className = this.getLayer().getClassName();
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, layerState) {

    this.preRender(this.layerContext, frameState);
    const image = this.getImage();
    if (image) {

      // clipped rendering if layer extent is set
      const extent = layerState.extent;
      const clipped = extent !== undefined &&
          !containsExtent(extent, frameState.extent) &&
          intersects(extent, frameState.extent);
      if (clipped) {
        this.clip(this.layerContext, frameState, extent);
      }

      const imageTransform = this.getImageTransform();

      // for performance reasons, context.setTransform is only used
      // when the view is rotated. see http://jsperf.com/canvas-transform
      const dx = imageTransform[4];
      const dy = imageTransform[5];
      const dw = image.width * imageTransform[0];
      const dh = image.height * imageTransform[3];

      if (dw >= 0.5 && dh >= 0.5) {
        this.clear(frameState);
        this.layerContext.drawImage(image, 0, 0, +image.width, +image.height,
          Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
      }

      if (clipped) {
        this.layerContext.restore();
      }
    }

    this.postRender(this.layerContext, frameState, layerState);

    const canvas = this.layerContext.canvas;
    const opacity = layerState.opacity;
    if (opacity !== canvas.style.opacity) {
      canvas.style.opacity = opacity;
    }

    const rotation = frameState.viewState.rotation;
    const transform = 'rotate(' + rotation + 'rad)';
    if (transform !== canvas.style.transform) {
      canvas.style.transform = transform;
    }

    return canvas;
  }

  /**
   * @abstract
   * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Canvas.
   */
  getImage() {
    return abstract();
  }

  /**
   * @abstract
   * @return {!import("../../transform.js").Transform} Image transform.
   */
  getImageTransform() {
    return abstract();
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   */
  clear(frameState) {
    const pixelRatio = frameState.pixelRatio;
    const canvas = this.layerContext.canvas;
    const width = Math.round(frameState.size[0] * pixelRatio);
    const height = Math.round(frameState.size[1] * pixelRatio);

    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = (width / pixelRatio) + 'px';
      canvas.style.height = (height / pixelRatio) + 'px';
    } else {
      this.layerContext.clearRect(0, 0, width, height);
    }
  }

  /**
   * @inheritDoc
   */
  forEachLayerAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    if (!this.getImage()) {
      return undefined;
    }

    const pixel = applyTransform(this.coordinateToCanvasPixelTransform, coordinate.slice());
    scaleCoordinate(pixel, frameState.viewState.resolution / this.renderedResolution);

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.getImage(), pixel[0], pixel[1], 1, 1, 0, 0, 1, 1);

    const imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer(), imageData);
    } else {
      return undefined;
    }
  }
}


export default IntermediateCanvasRenderer;
