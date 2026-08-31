/**
 * @module ol/renderer/canvas/VectorImageLayer
 */
import RBush from 'rbush';
import ImageCanvas from '../../ImageCanvas.js';
import ImageState from '../../ImageState.js';
import ViewHint from '../../ViewHint.js';
import EventType from '../../events/EventType.js';
import {
  equals,
  getForViewAndSize,
  getHeight,
  getWidth,
  isEmpty,
  scaleFromCenter,
} from '../../extent.js';
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

    /**
     * @private
     * @type {boolean}
     */
    this.rotateContent_ = layer.getRotateContent();
    this.vectorRenderer_.screenAligned = this.rotateContent_;

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
    let renderedExtent = /** @type {import("../../extent.js").Extent} */ (
      frameState.extent
    );

    // The extent stored on the image, the size of the rendered image in css
    // pixels, and the rotation baked into the rendered image. With rotateContent
    // the image is rendered screen-aligned: imageExtent describes its unrotated
    // footprint, and the actual footprint is that extent rotated by
    // imageRotation around its center.
    let imageExtent, imageSize;
    let imageRotation = 0;
    if (this.rotateContent_) {
      imageRotation = viewState.rotation;
      // The device pixel dimensions the map viewport canvas will get, and a
      // whole number of padding pixels per side for imageRatio, so the settled
      // blit offset (canvas size - image size) / 2 is always an integer and
      // the copy is lossless.
      const canvasWidth = Math.round(frameState.size[0] * pixelRatio);
      const canvasHeight = Math.round(frameState.size[1] * pixelRatio);
      const padX = Math.round((canvasWidth * (this.layerImageRatio_ - 1)) / 2);
      const padY = Math.round((canvasHeight * (this.layerImageRatio_ - 1)) / 2);
      imageSize = [
        (canvasWidth + 2 * padX) / pixelRatio,
        (canvasHeight + 2 * padY) / pixelRatio,
      ];
      imageExtent = getForViewAndSize(
        viewState.center,
        viewResolution,
        0,
        imageSize,
      );
      // Axis-aligned bounding extent of the rotated image footprint, for
      // feature loading and culling by the wrapped renderer.
      renderedExtent = getForViewAndSize(
        viewState.center,
        viewResolution,
        imageRotation,
        imageSize,
      );
    } else {
      if (this.layerImageRatio_ !== 1) {
        renderedExtent = renderedExtent.slice(0);
        scaleFromCenter(renderedExtent, this.layerImageRatio_);
      }
      imageSize = [
        getWidth(renderedExtent) / viewResolution,
        getHeight(renderedExtent) / viewResolution,
      ];
      imageExtent = renderedExtent;
    }

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
          viewState: this.rotateContent_
            ? frameState.viewState
            : /** @type {import("../../View.js").State} */ (
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
      const image = new ImageCanvas(
        imageExtent,
        viewResolution,
        pixelRatio,
        context.canvas,
        (callback) => {
          if (
            vectorRenderer.prepareFrame(imageFrameState) &&
            (vectorRenderer.replayGroupChanged ||
              // With rotateContent the image pixels depend on the rotation and
              // the rendered footprint, so an unchanged replay group can still
              // require a re-render.
              (this.rotateContent_ &&
                (!this.image ||
                  this.image.getRotation() !== imageRotation ||
                  !equals(this.image.getExtent(), imageExtent))))
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
        imageRotation,
      );

      image.addEventListener(EventType.CHANGE, () => {
        if (image.getState() !== ImageState.LOADED) {
          return;
        }
        this.image = image;
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
