/**
 * @module ol/renderer/canvas/VectorImageLayer
 */
import CanvasImageLayerRenderer from './ImageLayer.js';
import CanvasVectorLayerRenderer from './VectorLayer.js';
import EventType from '../../events/EventType.js';
import ImageCanvas from '../../ImageCanvas.js';
import ImageState from '../../ImageState.js';
import RBush from 'rbush';
import ViewHint from '../../ViewHint.js';
import {apply, compose, create} from '../../transform.js';
import {fromResolutionLike} from '../../resolution.js';
import {getHeight, getWidth, isEmpty, scaleFromCenter} from '../../extent.js';

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
   * Clean up.
   */
  disposeInternal() {
    this.vectorRenderer_.dispose();
    super.disposeInternal();
  }

  /**
   * Asynchronous layer level hit detection.
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../../Feature").default>>} Promise that resolves with an array of features.
   */
  getFeatures(pixel) {
    if (!this.vectorRenderer_) {
      return Promise.resolve([]);
    }
    const vectorPixel = apply(
      this.coordinateToVectorPixelTransform_,
      apply(this.renderedPixelToCoordinateTransform_, pixel.slice()),
    );
    return this.vectorRenderer_.getFeatures(vectorPixel);
  }

  /**
   * Perform action necessary to get the layer rendered after new fonts have loaded
   */
  handleFontsChanged() {
    this.vectorRenderer_.handleFontsChanged();
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
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

    if (
      !hints[ViewHint.ANIMATING] &&
      !hints[ViewHint.INTERACTING] &&
      !isEmpty(renderedExtent)
    ) {
      vectorRenderer.useContainer(null, null);
      const context = vectorRenderer.context;
      const layerState = frameState.layerStatesArray[frameState.layerIndex];
      const imageLayerState = Object.assign({}, layerState, {opacity: 1});
      const imageFrameState = /** @type {import("../../Map.js").FrameState} */ (
        Object.assign({}, frameState, {
          extent: renderedExtent,
          size: [width, height],
          viewState: /** @type {import("../../View.js").State} */ (
            Object.assign({}, frameState.viewState, {
              rotation: 0,
            })
          ),
          layerStatesArray: [imageLayerState],
          layerIndex: 0,
          declutter: null,
        })
      );
      const declutter = this.getLayer().getDeclutter();
      if (declutter) {
        imageFrameState.declutter = {
          [declutter]: new RBush(9),
        };
      }
      let emptyImage = true;
      const image = new ImageCanvas(
        renderedExtent,
        viewResolution,
        pixelRatio,
        context.canvas,
        function (callback) {
          if (
            vectorRenderer.prepareFrame(imageFrameState) &&
            vectorRenderer.replayGroupChanged
          ) {
            vectorRenderer.clipping = false;
            if (vectorRenderer.renderFrame(imageFrameState, null)) {
              vectorRenderer.renderDeclutter(imageFrameState);
              vectorRenderer.renderDeferred(imageFrameState);
              emptyImage = false;
            }
            callback();
          }
        },
      );

      image.addEventListener(EventType.CHANGE, () => {
        if (image.getState() !== ImageState.LOADED) {
          return;
        }
        this.image_ = emptyImage ? null : image;
        const imagePixelRatio = image.getPixelRatio();
        const renderedResolution =
          (fromResolutionLike(image.getResolution()) * pixelRatio) /
          imagePixelRatio;
        this.renderedResolution = renderedResolution;
        this.coordinateToVectorPixelTransform_ = compose(
          this.coordinateToVectorPixelTransform_,
          width / 2,
          height / 2,
          1 / renderedResolution,
          -1 / renderedResolution,
          0,
          -viewState.center[0],
          -viewState.center[1],
        );
      });
      image.load();
    }

    if (this.image_) {
      this.renderedPixelToCoordinateTransform_ =
        frameState.pixelToCoordinateTransform.slice();
    }

    return !!this.image_;
  }

  /**
   */
  preRender() {}

  /**
   */
  postRender() {}

  /**
   */
  renderDeclutter() {}

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches,
  ) {
    if (this.vectorRenderer_) {
      return this.vectorRenderer_.forEachFeatureAtCoordinate(
        coordinate,
        frameState,
        hitTolerance,
        callback,
        matches,
      );
    }
    return super.forEachFeatureAtCoordinate(
      coordinate,
      frameState,
      hitTolerance,
      callback,
      matches,
    );
  }
}

export default CanvasVectorImageLayerRenderer;
