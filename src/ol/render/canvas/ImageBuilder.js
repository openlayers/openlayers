/**
 * @module ol/render/canvas/ImageBuilder
 */
import {containsCoordinate, intersects} from '../../extent.js';
import {interpolatePoint} from '../../geom/flat/interpolate.js';
import {lineChunk} from '../../geom/flat/linechunk.js';
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
     * @type {number|undefined}
     */
    this.repeat_ = undefined;

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
    this.appendImageInstruction_(myBegin, myEnd, this.rotation_);
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
    this.appendImageInstruction_(myBegin, myEnd, this.rotation_);
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/LineString.js").default|import("../Feature.js").default} lineStringGeometry Line string geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawLineString(lineStringGeometry, feature, index) {
    if (!this.image_) {
      return;
    }
    const geometryExtent = lineStringGeometry.getExtent();
    if (this.maxExtent && !intersects(this.maxExtent, geometryExtent)) {
      return;
    }
    this.beginGeometry(lineStringGeometry, feature, index ?? 0);
    const flatCoordinates = lineStringGeometry.getFlatCoordinates();
    const stride = lineStringGeometry.getStride();
    this.drawChunkedImages_(flatCoordinates, 0, flatCoordinates.length, stride);
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/MultiLineString.js").default|import("../Feature.js").default} multiLineStringGeometry MultiLineString geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawMultiLineString(multiLineStringGeometry, feature, index) {
    if (!this.image_) {
      return;
    }
    const geometryExtent = multiLineStringGeometry.getExtent();
    if (this.maxExtent && !intersects(this.maxExtent, geometryExtent)) {
      return;
    }
    this.beginGeometry(multiLineStringGeometry, feature, index ?? 0);
    const ends =
      /** @type {import("../../geom/MultiLineString.js").default} */ (
        multiLineStringGeometry
      ).getEnds();
    const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
    const stride = multiLineStringGeometry.getStride();
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      this.drawChunkedImages_(flatCoordinates, offset, ends[i], stride);
      offset = ends[i];
    }
    this.endGeometry(feature);
  }

  /**
   * Split a sub-line into equal-length chunks (or a single chunk when `repeat_` is not
   * set) and draw one image per chunk, rotated to follow that chunk's own start/end
   * tangent.
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @private
   */
  drawChunkedImages_(flatCoordinates, offset, end, stride) {
    const chunkLength = this.repeat_
      ? this.repeat_ * this.resolution
      : Infinity;
    const chunks = lineChunk(chunkLength, flatCoordinates, offset, end, stride);
    for (let i = 0, ii = chunks.length; i < ii; ++i) {
      const chunk = chunks[i];
      if (chunk.length < 4) {
        continue;
      }
      const x0 = chunk[0];
      const y0 = chunk[1];
      const x1 = chunk[chunk.length - 2];
      const y1 = chunk[chunk.length - 1];
      // the y axis is flipped between map coordinates and canvas pixels
      const rotation = Math.atan2(y0 - y1, x1 - x0);
      const anchor = interpolatePoint(chunk, 0, chunk.length, 2, 0.5);
      this.drawImageAtCoordinate_(anchor, rotation);
    }
  }

  /**
   * Push one `DRAW_IMAGE` instruction for a single anchor coordinate, using the
   * provided rotation instead of the image style's own fixed rotation.
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate to draw the image at.
   * @param {number} rotation Rotation (radians).
   * @private
   */
  drawImageAtCoordinate_(coordinate, rotation) {
    const myBegin = this.coordinates.length;
    const myEnd = this.appendFlatPointCoordinates(coordinate, 2);
    if (myEnd === myBegin) {
      return;
    }
    this.appendImageInstruction_(myBegin, myEnd, rotation);
  }

  /**
   * Append one `DRAW_IMAGE` instruction (and its hit-detection counterpart) covering the
   * coordinates in `this.coordinates` between `myBegin` and `myEnd`.
   * @param {number} myBegin Begin index into `this.coordinates`.
   * @param {number} myEnd End index into `this.coordinates`.
   * @param {number|undefined} rotation Rotation (radians).
   * @private
   */
  appendImageInstruction_(myBegin, myEnd, rotation) {
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
      rotation,
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
      rotation,
      this.scale_,
      this.width_,
      this.declutterMode_,
      this.declutterImageWithText_,
    ]);
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
    this.repeat_ = undefined;
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
    this.repeat_ = imageStyle.getRepeat();
    this.declutterMode_ = imageStyle.getDeclutterMode();
    this.declutterImageWithText_ =
      /** @type {import("../canvas.js").DeclutterImageWithText|undefined} */ (
        sharedData
      );
  }
}

export default CanvasImageBuilder;
