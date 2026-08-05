/**
 * @module ol/render/canvas/ImageBuilder
 */
import {containsCoordinate} from '../../extent.js';
import CanvasBuilder from './Builder.js';
import CanvasInstruction from './Instruction.js';

class CanvasImageBuilder extends CanvasBuilder {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Maximum extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   */
  constructor(tolerance, maxExtent, resolution, pixelRatio) {
    super(tolerance, maxExtent, resolution, pixelRatio);

    /**
     * @private
     * @type {import('../../DataTile.js').ImageLike|null}
     */
    this.hitDetectionImage_ = null;

    /**
     * @private
     * @type {import('../../DataTile.js').ImageLike|null}
     */
    this.image_ = null;

    /**
     * @private
     * @type {number|undefined}
     */
    this.imagePixelRatio_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.anchorX_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.anchorY_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.height_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.opacity_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.originX_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.originY_ = undefined;

    /**
     * @private
     * @type {boolean|undefined}
     */
    this.rotateWithView_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.rotation_ = undefined;

    /**
     * @private
     * @type {import("../../size.js").Size|undefined}
     */
    this.scale_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.width_ = undefined;

    /**
     * @private
     * @type {import('../../style/Style.js').DeclutterMode|undefined}
     */
    this.declutterMode_ = undefined;

    /**
     * Data shared with a text builder for combined decluttering.
     * @private
     * @type {import("../canvas.js").DeclutterImageWithText|undefined}
     */
    this.declutterImageWithText_ = undefined;
  }

  /**
   * @param {import("../../geom/Point.js").default|import("../Feature.js").default} pointGeometry Point geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawPoint(pointGeometry, feature, index) {
    if (
      !this.image_ ||
      (this.maxExtent &&
        !containsCoordinate(this.maxExtent, pointGeometry.getFlatCoordinates()))
    ) {
      return;
    }
    this.beginGeometry(pointGeometry, feature, index ?? 0);
    const flatCoordinates = pointGeometry.getFlatCoordinates();
    const stride = pointGeometry.getStride();
    const myBegin = this.coordinates.length;
    const myEnd = this.appendFlatPointCoordinates(flatCoordinates, stride);
    const imagePixelRatio = this.imagePixelRatio_ ?? 1;
    const anchorX = this.anchorX_ ?? 0;
    const anchorY = this.anchorY_ ?? 0;
    const height = this.height_ ?? 0;
    const originX = this.originX_ ?? 0;
    const originY = this.originY_ ?? 0;
    const scale = this.scale_ ?? [1, 1];
    const width = this.width_ ?? 0;
    this.instructions.push([
      CanvasInstruction.DRAW_IMAGE,
      myBegin,
      myEnd,
      this.image_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      anchorX * imagePixelRatio,
      anchorY * imagePixelRatio,
      Math.ceil(height * imagePixelRatio),
      this.opacity_,
      originX * imagePixelRatio,
      originY * imagePixelRatio,
      this.rotateWithView_,
      this.rotation_,
      [
        (scale[0] * this.pixelRatio) / imagePixelRatio,
        (scale[1] * this.pixelRatio) / imagePixelRatio,
      ],
      Math.ceil(width * imagePixelRatio),
      this.declutterMode_,
      this.declutterImageWithText_,
    ]);
    this.hitDetectionInstructions.push([
      CanvasInstruction.DRAW_IMAGE,
      myBegin,
      myEnd,
      this.hitDetectionImage_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_,
      this.anchorY_,
      this.height_,
      1,
      this.originX_,
      this.originY_,
      this.rotateWithView_,
      this.rotation_,
      this.scale_,
      this.width_,
      this.declutterMode_,
      this.declutterImageWithText_,
    ]);
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/MultiPoint.js").default|import("../Feature.js").default} multiPointGeometry MultiPoint geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawMultiPoint(multiPointGeometry, feature, index) {
    if (!this.image_) {
      return;
    }
    this.beginGeometry(multiPointGeometry, feature, index ?? 0);
    const flatCoordinates = multiPointGeometry.getFlatCoordinates();
    const filteredFlatCoordinates = [];
    for (
      let i = 0, ii = flatCoordinates.length;
      i < ii;
      i += multiPointGeometry.getStride()
    ) {
      if (
        !this.maxExtent ||
        containsCoordinate(this.maxExtent, flatCoordinates.slice(i, i + 2))
      ) {
        filteredFlatCoordinates.push(
          flatCoordinates[i],
          flatCoordinates[i + 1],
        );
      }
    }
    const myBegin = this.coordinates.length;
    const myEnd = this.appendFlatPointCoordinates(filteredFlatCoordinates, 2);
    const imagePixelRatio = this.imagePixelRatio_ ?? 1;
    const anchorX = this.anchorX_ ?? 0;
    const anchorY = this.anchorY_ ?? 0;
    const height = this.height_ ?? 0;
    const originX = this.originX_ ?? 0;
    const originY = this.originY_ ?? 0;
    const scale = this.scale_ ?? [1, 1];
    const width = this.width_ ?? 0;
    this.instructions.push([
      CanvasInstruction.DRAW_IMAGE,
      myBegin,
      myEnd,
      this.image_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      anchorX * imagePixelRatio,
      anchorY * imagePixelRatio,
      Math.ceil(height * imagePixelRatio),
      this.opacity_,
      originX * imagePixelRatio,
      originY * imagePixelRatio,
      this.rotateWithView_,
      this.rotation_,
      [
        (scale[0] * this.pixelRatio) / imagePixelRatio,
        (scale[1] * this.pixelRatio) / imagePixelRatio,
      ],
      Math.ceil(width * imagePixelRatio),
      this.declutterMode_,
      this.declutterImageWithText_,
    ]);
    this.hitDetectionInstructions.push([
      CanvasInstruction.DRAW_IMAGE,
      myBegin,
      myEnd,
      this.hitDetectionImage_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_,
      this.anchorY_,
      this.height_,
      1,
      this.originX_,
      this.originY_,
      this.rotateWithView_,
      this.rotation_,
      this.scale_,
      this.width_,
      this.declutterMode_,
      this.declutterImageWithText_,
    ]);
    this.endGeometry(feature);
  }

  /**
   * @return {import("../canvas.js").SerializableInstructions} the serializable instructions.
   * @override
   */
  finish() {
    this.reverseHitDetectionInstructions();
    // FIXME this doesn't really protect us against further calls to draw*Geometry
    this.anchorX_ = undefined;
    this.anchorY_ = undefined;
    this.hitDetectionImage_ = null;
    this.image_ = null;
    this.imagePixelRatio_ = undefined;
    this.height_ = undefined;
    this.scale_ = undefined;
    this.opacity_ = undefined;
    this.originX_ = undefined;
    this.originY_ = undefined;
    this.rotateWithView_ = undefined;
    this.rotation_ = undefined;
    this.width_ = undefined;
    return super.finish();
  }

  /**
   * @param {import("../../style/Image.js").default} imageStyle Image style.
   * @param {Object} [sharedData] Shared data.
   * @override
   */
  setImageStyle(imageStyle, sharedData) {
    const anchor = imageStyle.getAnchor();
    const size = imageStyle.getSize();
    const origin = imageStyle.getOrigin();
    if (!anchor || !size || !origin) {
      return;
    }
    this.imagePixelRatio_ = imageStyle.getPixelRatio(this.pixelRatio);
    this.anchorX_ = anchor[0];
    this.anchorY_ = anchor[1];
    this.hitDetectionImage_ = imageStyle.getHitDetectionImage();
    this.image_ = imageStyle.getImage(this.pixelRatio);
    this.height_ = size[1];
    this.opacity_ = imageStyle.getOpacity();
    this.originX_ = origin[0];
    this.originY_ = origin[1];
    this.rotateWithView_ = imageStyle.getRotateWithView();
    this.rotation_ = imageStyle.getRotation();
    this.scale_ = imageStyle.getScaleArray();
    this.width_ = size[0];
    this.declutterMode_ = imageStyle.getDeclutterMode();
    this.declutterImageWithText_ =
      /** @type {import("../canvas.js").DeclutterImageWithText|undefined} */ (
        sharedData
      );
  }
}

export default CanvasImageBuilder;
