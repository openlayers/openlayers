/**
 * @module ol/renderer/canvas/VectorImageLayer
 */
import RBush from 'rbush';
import ImageCanvas from '../../ImageCanvas.js';
import ImageState from '../../ImageState.js';
import ViewHint from '../../ViewHint.js';
import EventType from '../../events/EventType.js';
import {equals, getForViewAndSize, isEmpty} from '../../extent.js';
import {fromResolutionLike} from '../../resolution.js';
import {apply, compose, create} from '../../transform.js';
import CanvasImageLayerRenderer from './ImageLayer.js';
import CanvasVectorLayerRenderer from './VectorLayer.js';

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
    super(
      /** @type {import("../../layer/Image.js").default<any>} */ (
        /** @type {unknown} */ (layer)
      ),
    );

    /**
     * @private
     * @type {import("./VectorLayer.js").default}
     */
    this.vectorRenderer_ = new CanvasVectorLayerRenderer(
      /** @type {import("../../layer/Vector.js").default} */ (
        /** @type {unknown} */ (layer)
      ),
    );

    /**
     * @private
     * @type {number}
     */
    this.layerImageRatio_ = layer.getImageRatio();

    this.sourceRotates = true;
    this.vectorRenderer_.sourceRotates = true;

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.coordinateToVectorPixelTransform_ = create();

    /**
     * @private
     * @type {import("../../transform.js").Transform|null}
     */
    this.renderedPixelToCoordinateTransform_ = null;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.vectorRenderer_.dispose();
    super.disposeInternal();
  }

  /**
   * Asynchronous layer level hit detection.
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../../Feature.js").default>>} Promise that resolves with an array of features.
   * @override
   */
  getFeatures(pixel) {
    if (!this.vectorRenderer_) {
      return Promise.resolve([]);
    }
    const vectorPixel = apply(
      this.coordinateToVectorPixelTransform_,
      apply(
        /** @type {import("../../transform.js").Transform} */ (
          this.renderedPixelToCoordinateTransform_
        ),
        pixel.slice(),
      ),
    );
    return this.vectorRenderer_.getFeatures(vectorPixel);
  }

  /**
   * Perform action necessary to get the layer rendered after new fonts have loaded
   * @override
   */
  handleFontsChanged() {
    this.vectorRenderer_.handleFontsChanged();
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @override
   */
  prepareFrame(frameState) {
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const hints = frameState.viewHints;
    const vectorRenderer = this.vectorRenderer_;

    const imageRotation = viewState.rotation;
    // Whole padding pixels per side for imageRatio, so the settled blit offset
    // (canvas size - image size) / 2 is always an integer and the copy lossless.
    const canvasWidth = Math.round(frameState.size[0] * pixelRatio);
    const canvasHeight = Math.round(frameState.size[1] * pixelRatio);
    const padX = Math.round((canvasWidth * (this.layerImageRatio_ - 1)) / 2);
    const padY = Math.round((canvasHeight * (this.layerImageRatio_ - 1)) / 2);
    const imageSize = [
      (canvasWidth + 2 * padX) / pixelRatio,
      (canvasHeight + 2 * padY) / pixelRatio,
    ];
    // The image is rendered screen-aligned: imageExtent is its unrotated
    // footprint, rotated by imageRotation around its center on screen.
    const imageExtent = getForViewAndSize(
      viewState.center,
      viewResolution,
      0,
      imageSize,
    );
    // Axis-aligned bounding extent of the rotated footprint, for feature
    // loading and culling by the wrapped renderer.
    const renderedExtent = getForViewAndSize(
      viewState.center,
      viewResolution,
      imageRotation,
      imageSize,
    );

    if (
      !hints[ViewHint.ANIMATING] &&
      !hints[ViewHint.INTERACTING] &&
      !isEmpty(renderedExtent)
    ) {
      vectorRenderer.useContainer(
        /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
        /** @type {string} */ (/** @type {unknown} */ (null)),
      );
      const context =
        /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */ (
          vectorRenderer.context
        );
      const layerState = frameState.layerStatesArray[frameState.layerIndex];
      const imageLayerState = Object.assign({}, layerState, {opacity: 1});
      const imageFrameState = /** @type {import("../../Map.js").FrameState} */ (
        Object.assign({}, frameState, {
          extent: renderedExtent,
          size: imageSize,
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
      const image = new ImageCanvas(
        imageExtent,
        viewResolution,
        pixelRatio,
        context.canvas,
        (callback) => {
          if (
            vectorRenderer.prepareFrame(imageFrameState) &&
            // An unchanged replay group still needs a re-render when the
            // rotation or the rendered footprint changed.
            (vectorRenderer.replayGroupChanged ||
              !this.image ||
              this.renderedRotation !== imageRotation ||
              !equals(this.image.getExtent(), imageExtent))
          ) {
            vectorRenderer.clipping = false;
            vectorRenderer.renderFrame(
              imageFrameState,
              /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
            );
            vectorRenderer.renderDeclutter(imageFrameState);
            vectorRenderer.renderDeferred(imageFrameState);
            callback();
          }
        },
      );

      image.addEventListener(EventType.CHANGE, () => {
        if (image.getState() !== ImageState.LOADED) {
          return;
        }
        this.image = image;
        this.renderedRotation = imageRotation;
        const imagePixelRatio = image.getPixelRatio();
        const renderedResolution =
          (fromResolutionLike(image.getResolution()) * pixelRatio) /
          imagePixelRatio;
        this.renderedResolution = renderedResolution;
        this.coordinateToVectorPixelTransform_ = compose(
          this.coordinateToVectorPixelTransform_,
          imageSize[0] / 2,
          imageSize[1] / 2,
          1 / renderedResolution,
          -1 / renderedResolution,
          -imageRotation,
          -viewState.center[0],
          -viewState.center[1],
        );
      });
      image.load();
    }

    if (this.image) {
      this.renderedPixelToCoordinateTransform_ =
        frameState.pixelToCoordinateTransform.slice();
    }

    return !this.getLayer().getSource()?.loading && !!this.image;
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
   * @override
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
