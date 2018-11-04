/**
 * @module ol/renderer/canvas/ImageLayer
 */
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {getIntersection, isEmpty} from '../../extent.js';
import IntermediateCanvasRenderer from './IntermediateCanvas.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
class CanvasImageLayerRenderer extends IntermediateCanvasRenderer {

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

    /**
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.imageTransform_ = createTransform();

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
  getImageTransform() {
    return this.imageTransform_;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {

    const pixelRatio = frameState.pixelRatio;
    const size = frameState.size;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;

    let image;
    const imageLayer = /** @type {import("../../layer/Image.js").default} */ (this.getLayer());
    const imageSource = /** @type {import("../../source/Image.js").default} */ (imageLayer.getSource());

    const hints = frameState.viewHints;

    let renderedExtent = frameState.extent;
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(renderedExtent, layerState.extent);
    }

    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] &&
        !isEmpty(renderedExtent)) {
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

    if (this.image_) {
      image = this.image_;
      const imageExtent = image.getExtent();
      const imageResolution = image.getResolution();
      const imagePixelRatio = image.getPixelRatio();
      const scale = pixelRatio * imageResolution /
          (viewResolution * imagePixelRatio);
      const transform = composeTransform(this.imageTransform_,
        pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
        scale, scale,
        0,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
      composeTransform(this.coordinateToCanvasPixelTransform,
        pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
        pixelRatio / viewResolution, -pixelRatio / viewResolution,
        0,
        -viewCenter[0], -viewCenter[1]);

      this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
    }

    return !!this.image_;
  }

}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasImageLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.IMAGE;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {CanvasImageLayerRenderer} The layer renderer.
 */
CanvasImageLayerRenderer['create'] = function(mapRenderer, layer) {
  return new CanvasImageLayerRenderer(/** @type {import("../../layer/Image.js").default} */ (layer));
};


export default CanvasImageLayerRenderer;
