/**
 * @module ol/renderer/canvas/ImageLayer
 */
import CanvasLayerRenderer from './Layer.js';
import ViewHint from '../../ViewHint.js';
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import {IMAGE_SMOOTHING_DISABLED, IMAGE_SMOOTHING_ENABLED} from './common.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  makeInverse,
  toString as toTransformString,
} from '../../transform.js';
import {assign} from '../../obj.js';
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
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   */
  getImage() {
    return !this.image_ ? null : this.image_.getImage();
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    const imageSource = this.getLayer().getSource();

    const hints = frameState.viewHints;

    let renderedExtent = frameState.extent;
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(
        renderedExtent,
        fromUserExtent(layerState.extent, viewState.projection)
      );
    }

    if (
      !hints[ViewHint.ANIMATING] &&
      !hints[ViewHint.INTERACTING] &&
      !isEmpty(renderedExtent)
    ) {
      if (imageSource) {
        let projection = viewState.projection;
        if (!ENABLE_RASTER_REPROJECTION) {
          const sourceProjection = imageSource.getProjection();
          if (sourceProjection) {
            projection = sourceProjection;
          }
        }
        const image = imageSource.getImage(
          renderedExtent,
          viewResolution,
          pixelRatio,
          projection
        );
        if (image && this.loadImage(image)) {
          this.image_ = image;
        } else {
          this.image_ = null;
        }
      } else {
        this.image_ = null;
      }
    }

    return !!this.image_;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray} Data at the pixel location.
   */
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }

    const layer = this.getLayer();
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );

    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }

    const imageExtent = this.image_.getExtent();
    const img = this.image_.getImage();

    const imageMapWidth = getWidth(imageExtent);
    const col = Math.floor(
      img.width * ((coordinate[0] - imageExtent[0]) / imageMapWidth)
    );
    if (col < 0 || col >= img.width) {
      return null;
    }

    const imageMapHeight = getHeight(imageExtent);
    const row = Math.floor(
      img.height * ((imageExtent[3] - coordinate[1]) / imageMapHeight)
    );
    if (row < 0 || row >= img.height) {
      return null;
    }

    return this.getImageData(img, col, row);
  }

  /**
   * Render the layer.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, target) {
    const image = this.image_;
    const imageExtent = image.getExtent();
    const imageResolution = image.getResolution();
    const imagePixelRatio = image.getPixelRatio();
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;
    const size = frameState.size;
    const scale =
      (pixelRatio * imageResolution) / (viewResolution * imagePixelRatio);

    let width = Math.round(size[0] * pixelRatio);
    let height = Math.round(size[1] * pixelRatio);
    const rotation = viewState.rotation;
    if (rotation) {
      const size = Math.round(Math.sqrt(width * width + height * height));
      width = size;
      height = size;
    }

    // set forward and inverse pixel transforms
    composeTransform(
      this.pixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / pixelRatio,
      1 / pixelRatio,
      rotation,
      -width / 2,
      -height / 2
    );
    makeInverse(this.inversePixelTransform, this.pixelTransform);

    const canvasTransform = toTransformString(this.pixelTransform);

    this.useContainer(
      target,
      canvasTransform,
      layerState.opacity,
      this.getBackground(frameState)
    );

    const context = this.context;
    const canvas = context.canvas;

    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else if (!this.containerReused) {
      context.clearRect(0, 0, width, height);
    }

    // clipped rendering if layer extent is set
    let clipped = false;
    let render = true;
    if (layerState.extent) {
      const layerExtent = fromUserExtent(
        layerState.extent,
        viewState.projection
      );
      render = intersectsExtent(layerExtent, frameState.extent);
      clipped = render && !containsExtent(layerExtent, frameState.extent);
      if (clipped) {
        this.clipUnrotated(context, frameState, layerExtent);
      }
    }

    const img = image.getImage();

    const transform = composeTransform(
      this.tempTransform,
      width / 2,
      height / 2,
      scale,
      scale,
      0,
      (imagePixelRatio * (imageExtent[0] - viewCenter[0])) / imageResolution,
      (imagePixelRatio * (viewCenter[1] - imageExtent[3])) / imageResolution
    );

    this.renderedResolution = (imageResolution * pixelRatio) / imagePixelRatio;

    const dw = img.width * transform[0];
    const dh = img.height * transform[3];

    if (!this.getLayer().getSource().getInterpolate()) {
      assign(context, IMAGE_SMOOTHING_DISABLED);
    }

    this.preRender(context, frameState);
    if (render && dw >= 0.5 && dh >= 0.5) {
      const dx = transform[4];
      const dy = transform[5];
      const opacity = layerState.opacity;
      let previousAlpha;
      if (opacity !== 1) {
        previousAlpha = context.globalAlpha;
        context.globalAlpha = opacity;
      }
      context.drawImage(
        img,
        0,
        0,
        +img.width,
        +img.height,
        Math.round(dx),
        Math.round(dy),
        Math.round(dw),
        Math.round(dh)
      );
      if (opacity !== 1) {
        context.globalAlpha = previousAlpha;
      }
    }
    this.postRender(context, frameState);

    if (clipped) {
      context.restore();
    }
    assign(context, IMAGE_SMOOTHING_ENABLED);

    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }

    return this.container;
  }
}

export default CanvasImageLayerRenderer;
