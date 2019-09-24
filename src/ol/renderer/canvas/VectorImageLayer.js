/**
 * @module ol/renderer/canvas/VectorImageLayer
 */
import ImageCanvas from '../../ImageCanvas.js';
import ViewHint from '../../ViewHint.js';
import {getHeight, getWidth, isEmpty, scaleFromCenter} from '../../extent.js';
import {assign} from '../../obj.js';
import CanvasImageLayerRenderer from './ImageLayer.js';
import CanvasVectorLayerRenderer from './VectorLayer.js';
import EventType from '../../events/EventType.js';
import ImageState from '../../ImageState.js';
import {renderDeclutterItems} from '../../render.js';

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
  handleFontsChanged() {
    this.vectorRenderer_.handleFontsChanged();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState) {
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
      vectorRenderer.useContainer(null, null, 1);
      const context = vectorRenderer.context;
      const imageFrameState = /** @type {import("../../PluggableMap.js").FrameState} */ (assign({}, frameState, {
        declutterItems: [],
        size: [
          getWidth(renderedExtent) / viewResolution,
          getHeight(renderedExtent) / viewResolution
        ],
        viewState: /** @type {import("../../View.js").State} */ (assign({}, frameState.viewState, {
          rotation: 0
        }))
      }));
      const image = new ImageCanvas(renderedExtent, viewResolution, pixelRatio, context.canvas, function(callback) {
        if (vectorRenderer.prepareFrame(imageFrameState) && vectorRenderer.replayGroupChanged) {
          vectorRenderer.renderFrame(imageFrameState, null);
          renderDeclutterItems(imageFrameState, null);
          callback();
        }
      });

      image.addEventListener(EventType.CHANGE, function() {
        if (image.getState() === ImageState.LOADED) {
          this.image_ = image;
        }
      }.bind(this));
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
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, declutteredFeatures) {
    if (this.vectorRenderer_) {
      return this.vectorRenderer_.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, declutteredFeatures);
    } else {
      return super.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, declutteredFeatures);
    }
  }
}


export default CanvasVectorImageLayerRenderer;
