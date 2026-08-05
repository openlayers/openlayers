/**
 * @module ol/renderer/canvas/ImageLayer
 */
import ImageState from '../../ImageState.js';
import ViewHint from '../../ViewHint.js';
import {
  containsCoordinate,
  containsExtent,
  getHeight,
  getIntersection,
  getWidth,
  intersects as intersectsExtent,
  isEmpty,
} from '../../extent.js';
import {fromUserExtent} from '../../proj.js';
import {
  apply as applyTransform,
  compose as composeTransform,
} from '../../transform.js';
import CanvasLayerRenderer from './Layer.js';

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 * @extends {CanvasLayerRenderer<import("../../layer/Image.js").default<import("../../source/Image.js").default>>}
 */
class CanvasImageLayerRenderer extends CanvasLayerRenderer {
  /**
   * @param {import("../../layer/Image.js").default<import("../../source/Image.js").default>} imageLayer Image layer.
   */
  constructor(imageLayer) {
    super(imageLayer);

    /**
     * @protected
     * @type {?import("../../Image.js").default}
     */
    this.image = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedSourceRevision_ = 0;
  }

  /**
   * @return {import('../../DataTile.js').ImageLike|null} Image.
   */
  getImage() {
    return !this.image ? null : this.image.getImage();
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @override
   */
  prepareFrame(frameState) {
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const imageSource = this.getLayer().getSource();

    const hints = frameState.viewHints;

    let renderedExtent = /** @type {import("../../extent.js").Extent} */ (
      frameState.extent
    );
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(
        renderedExtent,
        fromUserExtent(layerState.extent, viewState.projection),
      );
    }

    if (
      !hints[ViewHint.ANIMATING] &&
      !hints[ViewHint.INTERACTING] &&
      !isEmpty(renderedExtent)
    ) {
      if (imageSource) {
        if (
          !(
            /** @type {{rendered: (boolean|undefined)}} */ (
              /** @type {unknown} */ (this.getLayer())
            ).rendered
          ) &&
          this.renderedSourceRevision_ !== imageSource.getRevision()
        ) {
          this.image = null;
        }
        this.renderedSourceRevision_ = imageSource.getRevision();

        const projection = viewState.projection;
        const image = imageSource.getImage(
          renderedExtent,
          viewResolution,
          pixelRatio,
          projection,
        );
        if (image) {
          if (this.loadImage(image)) {
            this.image = image;
          } else if (image.getState() === ImageState.EMPTY) {
            this.image = null;
          }
        }
      } else {
        this.image = null;
      }
    }

    return !!this.image;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|null} Data at the pixel location.
   * @override
   */
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState || !this.image) {
      return null;
    }

    const layer = this.getLayer();
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice(),
    );

    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }

    const imageExtent = this.image.getExtent();
    const img = this.image.getImage();
    if (!img) {
      return null;
    }

    const imageMapWidth = getWidth(imageExtent);
    const col = Math.floor(
      img.width * ((coordinate[0] - imageExtent[0]) / imageMapWidth),
    );
    if (col < 0 || col >= img.width) {
      return null;
    }

    const imageMapHeight = getHeight(imageExtent);
    const row = Math.floor(
      img.height * ((imageExtent[3] - coordinate[1]) / imageMapHeight),
    );
    if (row < 0 || row >= img.height) {
      return null;
    }

    return this.getImageData(img, col, row);
  }

  /**
   * Render the layer.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   * @override
   */
  renderFrame(frameState, target) {
    const image = this.image;
    if (!image) {
      return this.getContainerElement();
    }
    const imageExtent = image.getExtent();
    const imageResolution = image.getResolution();
    const [imageResolutionX, imageResolutionY] = Array.isArray(imageResolution)
      ? imageResolution
      : [imageResolution, imageResolution];
    const imagePixelRatio = image.getPixelRatio();
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;
    const scaleX =
      (pixelRatio * imageResolutionX) / (viewResolution * imagePixelRatio);
    const scaleY =
      (pixelRatio * imageResolutionY) / (viewResolution * imagePixelRatio);

    this.prepareContainer(frameState, target);

    // desired dimensions of the canvas in pixels
    const width = this.getCanvasContext().canvas.width;
    const height = this.getCanvasContext().canvas.height;

    const context = this.getRenderContext(frameState);

    // clipped rendering if layer extent is set
    let clipped = false;
    let render = true;
    if (layerState.extent) {
      const layerExtent = fromUserExtent(
        layerState.extent,
        viewState.projection,
      );
      const frameExtent = /** @type {import("../../extent.js").Extent} */ (
        frameState.extent
      );
      render = intersectsExtent(layerExtent, frameExtent);
      clipped = render && !containsExtent(layerExtent, frameExtent);
      if (clipped) {
        this.clipUnrotated(context, frameState, layerExtent);
      }
    }

    const img = image.getImage();
    if (!img) {
      return this.getContainerElement();
    }

    const transform = composeTransform(
      this.tempTransform,
      width / 2,
      height / 2,
      scaleX,
      scaleY,
      0,
      (imagePixelRatio * (imageExtent[0] - viewCenter[0])) / imageResolutionX,
      (imagePixelRatio * (viewCenter[1] - imageExtent[3])) / imageResolutionY,
    );

    this.renderedResolution = (imageResolutionY * pixelRatio) / imagePixelRatio;

    const dw = img.width * transform[0];
    const dh = img.height * transform[3];

    if (!this.getLayer().getSource()?.getInterpolate()) {
      context.imageSmoothingEnabled = false;
    }

    this.preRender(context, frameState);
    if (render && dw >= 0.5 && dh >= 0.5) {
      const dx = transform[4];
      const dy = transform[5];
      const opacity = layerState.opacity;
      if (opacity !== 1) {
        context.save();
        context.globalAlpha = opacity;
      }
      context.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
      if (opacity !== 1) {
        context.restore();
      }
    }
    this.postRender(this.getCanvasContext(), frameState);

    if (clipped) {
      context.restore();
    }
    context.imageSmoothingEnabled = true;
    return this.getContainerElement();
  }
}

export default CanvasImageLayerRenderer;
