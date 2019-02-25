/**
 * @module ol/render/canvas/ImageBuilder
 */
import CanvasInstruction from './Instruction.js';
import CanvasBuilder from './Builder.js';

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
     * @type {import("../canvas.js").DeclutterGroup}
     */
    this.declutterGroup_ = null;

    /**
     * @private
     * @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement}
     */
    this.hitDetectionImage_ = null;

    /**
     * @private
     * @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement}
     */
    this.image_ = null;

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
     * @type {number|undefined}
     */
    this.scale_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.width_ = undefined;

  }

  /**
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @private
   * @return {number} My end.
   */
  drawCoordinates_(flatCoordinates, offset, end, stride) {
    return this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false, false);
  }

  /**
   * @inheritDoc
   */
  drawPoint(pointGeometry, feature) {
    if (!this.image_) {
      return;
    }
    this.beginGeometry(feature);
    const flatCoordinates = pointGeometry.getFlatCoordinates();
    const stride = pointGeometry.getStride();
    const myBegin = this.coordinates.length;
    const myEnd = this.drawCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
    this.instructions.push([
      CanvasInstruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_, this.anchorY_, this.declutterGroup_, this.height_, this.opacity_,
      this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
      this.scale_ * this.pixelRatio, this.width_
    ]);
    this.hitDetectionInstructions.push([
      CanvasInstruction.DRAW_IMAGE, myBegin, myEnd, this.hitDetectionImage_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_, this.anchorY_, this.declutterGroup_, this.height_, this.opacity_,
      this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
      this.scale_, this.width_
    ]);
    this.endGeometry(feature);
  }

  /**
   * @inheritDoc
   */
  drawMultiPoint(multiPointGeometry, feature) {
    if (!this.image_) {
      return;
    }
    this.beginGeometry(feature);
    const flatCoordinates = multiPointGeometry.getFlatCoordinates();
    const stride = multiPointGeometry.getStride();
    const myBegin = this.coordinates.length;
    const myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
    this.instructions.push([
      CanvasInstruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_, this.anchorY_, this.declutterGroup_, this.height_, this.opacity_,
      this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
      this.scale_ * this.pixelRatio, this.width_
    ]);
    this.hitDetectionInstructions.push([
      CanvasInstruction.DRAW_IMAGE, myBegin, myEnd, this.hitDetectionImage_,
      // Remaining arguments to DRAW_IMAGE are in alphabetical order
      this.anchorX_, this.anchorY_, this.declutterGroup_, this.height_, this.opacity_,
      this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
      this.scale_, this.width_
    ]);
    this.endGeometry(feature);
  }

  /**
   * @inheritDoc
   */
  finish() {
    this.reverseHitDetectionInstructions();
    // FIXME this doesn't really protect us against further calls to draw*Geometry
    this.anchorX_ = undefined;
    this.anchorY_ = undefined;
    this.hitDetectionImage_ = null;
    this.image_ = null;
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
   * @inheritDoc
   */
  setImageStyle(imageStyle, declutterGroup) {
    const anchor = imageStyle.getAnchor();
    const size = imageStyle.getSize();
    const hitDetectionImage = imageStyle.getHitDetectionImage(1);
    const image = imageStyle.getImage(1);
    const origin = imageStyle.getOrigin();
    this.anchorX_ = anchor[0];
    this.anchorY_ = anchor[1];
    this.declutterGroup_ = /** @type {import("../canvas.js").DeclutterGroup} */ (declutterGroup);
    this.hitDetectionImage_ = hitDetectionImage;
    this.image_ = image;
    this.height_ = size[1];
    this.opacity_ = imageStyle.getOpacity();
    this.originX_ = origin[0];
    this.originY_ = origin[1];
    this.rotateWithView_ = imageStyle.getRotateWithView();
    this.rotation_ = imageStyle.getRotation();
    this.scale_ = imageStyle.getScale();
    this.width_ = size[0];
  }
}


export default CanvasImageBuilder;
