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
import {apply, compose, create} from '../../transform.js';

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

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.coordinateToVectorPixelTransform_ = create();

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.renderedPixelToCoordinateTransform_ = null;

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
  getFeatures(pixel) {
    if (this.vectorRenderer_) {
      const vectorPixel = apply(this.coordinateToVectorPixelTransform_,
        apply(this.renderedPixelToCoordinateTransform_, pixel.slice()));
      return this.vectorRenderer_.getFeatures(vectorPixel);
    } else {
      const promise = new Promise(function(resolve, reject) {
        resolve([]);
      });
      return promise;
    }
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
    const width = getWidth(renderedExtent) / viewResolution;
    const height = getHeight(renderedExtent) / viewResolution;

    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] && !isEmpty(renderedExtent)) {
      vectorRenderer.useContainer(null, null, 1);
      const context = vectorRenderer.context;
      const imageFrameState = /** @type {import("../../PluggableMap.js").FrameState} */ (assign({}, frameState, {
        declutterItems: [],
        size: [width, height],
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
      const renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
      this.renderedResolution = renderedResolution;
      this.renderedPixelToCoordinateTransform_ = frameState.pixelToCoordinateTransform.slice();
      this.coordinateToVectorPixelTransform_ = compose(this.coordinateToVectorPixelTransform_,
        width / 2, height / 2,
        1 / renderedResolution, -1 / renderedResolution,
        0,
        -viewState.center[0], -viewState.center[1]);
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
