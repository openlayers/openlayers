/**
 * @module ol/renderer/canvas/ImageLayer
 */
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import ViewHint from '../../ViewHint.js';
import {containsExtent, intersects} from '../../extent.js';
import {getIntersection, isEmpty} from '../../extent.js';
import CanvasLayerRenderer from './Layer.js';
import {compose as composeTransform, makeInverse, toString as transformToString} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
class CanvasImageLayerRenderer extends CanvasLayerRenderer {

  /**
   * @param {import("../../layer/Image.js").default} imageLayer Image layer.
   */
  constructor(imageLayer) {
    super(imageLayer);

    /**
     * @protected
     * @type {?import("../../ImageBase.js").default}
     */
    this.image_ = null;
  }

  /**
   * @inheritDoc
   */
  getImage() {
    return !this.image_ ? null : this.image_.getImage();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const imageSource = this.getLayer().getSource();

    const hints = frameState.viewHints;

    let renderedExtent = frameState.extent;
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(renderedExtent, layerState.extent);
    }

    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] && !isEmpty(renderedExtent)) {
      let projection = viewState.projection;
      if (!ENABLE_RASTER_REPROJECTION) {
        const sourceProjection = imageSource.getProjection();
        if (sourceProjection) {
          projection = sourceProjection;
        }
      }
      const image = imageSource.getImage(renderedExtent, viewResolution, pixelRatio, projection);
      if (image && this.loadImage(image)) {
        this.image_ = image;
      }
    }

    return !!this.image_;
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, layerState) {
    const image = this.image_;
    const imageExtent = image.getExtent();
    const imageResolution = image.getResolution();
    const imagePixelRatio = image.getPixelRatio();
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;
    const size = frameState.size;
    const scale = pixelRatio * imageResolution / (viewResolution * imagePixelRatio);

    let width = Math.round(size[0] * pixelRatio);
    let height = Math.round(size[1] * pixelRatio);
    const rotation = viewState.rotation;
    if (rotation) {
      const size = Math.round(Math.sqrt(width * width + height * height));
      width = height = size;
    }

    // set forward and inverse pixel transforms
    composeTransform(this.pixelTransform_,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / pixelRatio, 1 / pixelRatio,
      rotation,
      -width / 2, -height / 2
    );
    makeInverse(this.inversePixelTransform_, this.pixelTransform_);

    const context = this.context;
    const canvas = context.canvas;

    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      context.clearRect(0, 0, width, height);
    }

    // clipped rendering if layer extent is set
    const extent = layerState.extent;
    const clipped = extent !== undefined &&
          !containsExtent(extent, frameState.extent) &&
          intersects(extent, frameState.extent);
    if (clipped) {
      this.clip(context, frameState, extent);
    }

    const img = image.getImage();

    const transform = composeTransform(this.tempTransform_,
      width / 2, height / 2,
      scale, scale,
      0,
      imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
      imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);

    this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;

    const dx = transform[4];
    const dy = transform[5];
    const dw = img.width * transform[0];
    const dh = img.height * transform[3];

    this.preRender(context, frameState);
    if (dw >= 0.5 && dh >= 0.5) {
      this.context.drawImage(img, 0, 0, +img.width, +img.height,
        Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    }
    this.postRender(context, frameState);

    if (clipped) {
      context.restore();
    }

    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = opacity;
    }

    const canvasTransform = transformToString(this.pixelTransform_);
    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }

    return canvas;

  }

}


export default CanvasImageLayerRenderer;
