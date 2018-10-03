/**
 * @module ol/renderer/canvas/ImageLayer
 */
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import ImageCanvas from '../../ImageCanvas.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {equals} from '../../array.js';
import {getHeight, getIntersection, getWidth, isEmpty} from '../../extent.js';
import VectorRenderType from '../../layer/VectorRenderType.js';
import {assign} from '../../obj.js';
import {layerRendererConstructors} from './Map.js';
import IntermediateCanvasRenderer from './IntermediateCanvas.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
class CanvasImageLayerRenderer extends IntermediateCanvasRenderer {

  /**
   * @param {import("../../layer/Image.js").default|import("../../layer/Vector.js").default} imageLayer Image or vector layer.
   */
  constructor(imageLayer) {

    super(imageLayer);

    /**
     * @private
     * @type {?import("../../ImageBase.js").default}
     */
    this.image_ = null;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.imageTransform_ = createTransform();

    /**
     * @type {!Array<string>}
     */
    this.skippedFeatures_ = [];

    /**
     * @private
     * @type {import("./VectorLayer.js").default}
     */
    this.vectorRenderer_ = null;

    if (imageLayer.getType() === LayerType.VECTOR) {
      for (let i = 0, ii = layerRendererConstructors.length; i < ii; ++i) {
        const ctor = layerRendererConstructors[i];
        if (ctor !== CanvasImageLayerRenderer && ctor['handles'](imageLayer)) {
          this.vectorRenderer_ = /** @type {import("./VectorLayer.js").default} */ (new ctor(imageLayer));
          break;
        }
      }
    }

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.vectorRenderer_) {
      this.vectorRenderer_.dispose();
    }
    super.disposeInternal();
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

    const vectorRenderer = this.vectorRenderer_;
    let renderedExtent = frameState.extent;
    if (!vectorRenderer && layerState.extent !== undefined) {
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
      let skippedFeatures = this.skippedFeatures_;
      if (vectorRenderer) {
        const context = vectorRenderer.context;
        const imageFrameState = /** @type {import("../../PluggableMap.js").FrameState} */ (assign({}, frameState, {
          size: [
            getWidth(renderedExtent) / viewResolution,
            getHeight(renderedExtent) / viewResolution
          ],
          viewState: /** @type {import("../../View.js").State} */ (assign({}, frameState.viewState, {
            rotation: 0
          }))
        }));
        const newSkippedFeatures = Object.keys(imageFrameState.skippedFeatureUids).sort();
        image = new ImageCanvas(renderedExtent, viewResolution, pixelRatio, context.canvas, function(callback) {
          if (vectorRenderer.prepareFrame(imageFrameState, layerState) &&
              (vectorRenderer.replayGroupChanged ||
              !equals(skippedFeatures, newSkippedFeatures))) {
            context.canvas.width = imageFrameState.size[0] * pixelRatio;
            context.canvas.height = imageFrameState.size[1] * pixelRatio;
            vectorRenderer.compose(context, imageFrameState, layerState);
            skippedFeatures = newSkippedFeatures;
            callback();
          }
        });
      } else {
        image = imageSource.getImage(
          renderedExtent, viewResolution, pixelRatio, projection);
      }
      if (image && this.loadImage(image)) {
        this.image_ = image;
        this.skippedFeatures_ = skippedFeatures;
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

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    if (this.vectorRenderer_) {
      return this.vectorRenderer_.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg);
    } else {
      return super.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg);
    }
  }
}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasImageLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.IMAGE ||
    layer.getType() === LayerType.VECTOR &&
    /** @type {import("../../layer/Vector.js").default} */ (layer).getRenderMode() === VectorRenderType.IMAGE;
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
