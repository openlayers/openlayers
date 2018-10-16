/**
 * @module ol/renderer/canvas/IntermediateCanvas
 */
import {scale as scaleCoordinate} from '../../coordinate.js';
import {createCanvasContext2D} from '../../dom.js';
import {containsExtent, intersects} from '../../extent.js';
import CanvasLayerRenderer from '../canvas/Layer.js';
import {create as createTransform, apply as applyTransform} from '../../transform.js';

class IntermediateCanvasRenderer extends CanvasLayerRenderer {

  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   */
  constructor(layer) {

    super(layer);

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

  }

  /**
   * @inheritDoc
   */
  composeFrame(frameState, layerState, context) {

    this.preCompose(context, frameState);

    const image = this.getImage();
    if (image) {

      // clipped rendering if layer extent is set
      const extent = layerState.extent;
      const clipped = extent !== undefined &&
          !containsExtent(extent, frameState.extent) &&
          intersects(extent, frameState.extent);
      if (clipped) {
        this.clip(context, frameState, /** @type {import("../../extent.js").Extent} */ (extent));
      }

      const imageTransform = this.getImageTransform();
      // for performance reasons, context.save / context.restore is not used
      // to save and restore the transformation matrix and the opacity.
      // see http://jsperf.com/context-save-restore-versus-variable
      const alpha = context.globalAlpha;
      context.globalAlpha = layerState.opacity;

      // for performance reasons, context.setTransform is only used
      // when the view is rotated. see http://jsperf.com/canvas-transform
      const dx = imageTransform[4];
      const dy = imageTransform[5];
      const dw = image.width * imageTransform[0];
      const dh = image.height * imageTransform[3];
      if (dw >= 0.5 && dh >= 0.5) {
        context.drawImage(image, 0, 0, +image.width, +image.height,
          Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
      }
      context.globalAlpha = alpha;

      if (clipped) {
        context.restore();
      }
    }

    this.postCompose(context, frameState, layerState);
  }

  /**
   * @abstract
   * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Canvas.
   */
  getImage() {}

  /**
   * @abstract
   * @return {!import("../../transform.js").Transform} Image transform.
   */
  getImageTransform() {}

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
