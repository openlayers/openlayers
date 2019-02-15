/**
 * @module ol/renderer/canvas/ImageLayer
 */
import ImageCanvas from '../../ImageCanvas.js';
import ViewHint from '../../ViewHint.js';
import {equals} from '../../array.js';
import {getHeight, getWidth, isEmpty, scaleFromCenter} from '../../extent.js';
import {assign} from '../../obj.js';
import CanvasImageLayerRenderer from './ImageLayer.js';
import CanvasVectorLayerRenderer from './VectorLayer.js';
import {listen} from '../../events.js';
import EventType from '../../events/EventType.js';
import ImageState from '../../ImageState.js';

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
class CanvasVectorImageLayerRenderer extends CanvasImageLayerRenderer {

  /**
   * @param {import("../../layer/VectorImage.js").default} layer Vector image layer.
   */
  constructor(layer) {
    super(layer);

    /**
     * @type {!Array<string>}
     */
    this.skippedFeatures_ = [];

    /**
     * @private
     * @type {import("./VectorLayer.js").default}
     */
    this.vectorRenderer_ = new CanvasVectorLayerRenderer(layer);

    /**
     * @private
     * @type {number}
     */
    this.layerImageRatio_ = layer.getImageRatio();

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.vectorRenderer_.dispose();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const hints = frameState.viewHints;
    const vectorRenderer = this.vectorRenderer_;
    let renderedExtent = frameState.extent;
    if (this.layerImageRatio_ !== 1) {
      renderedExtent = renderedExtent.slice(0);
      scaleFromCenter(renderedExtent, this.layerImageRatio_);
    }

    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] && !isEmpty(renderedExtent)) {
      let skippedFeatures = this.skippedFeatures_;
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
      const image = new ImageCanvas(renderedExtent, viewResolution, pixelRatio, context.canvas, function(callback) {
        if (vectorRenderer.prepareFrame(imageFrameState, layerState) &&
              (vectorRenderer.replayGroupChanged ||
              !equals(skippedFeatures, newSkippedFeatures))) {
          vectorRenderer.renderFrame(imageFrameState, layerState);
          skippedFeatures = newSkippedFeatures;
          callback();
        }
      });

      listen(image, EventType.CHANGE, function() {
        if (image.getState() === ImageState.LOADED) {
          this.image_ = image;
          this.skippedFeatures_ = skippedFeatures;
        }
      }, this);
      image.load();
    }

    if (this.image_) {
      const image = this.image_;
      const imageResolution = image.getResolution();
      const imagePixelRatio = image.getPixelRatio();
      this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
    }

    return !!this.image_;
  }

  /**
   * @override
   */
  preRender() {}

  /**
   * @override
   */
  postRender() {}

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback) {
    if (this.vectorRenderer_) {
      return this.vectorRenderer_.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback);
    } else {
      return super.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback);
    }
  }
}


export default CanvasVectorImageLayerRenderer;
