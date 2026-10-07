/**
 * @module ol/render/canvas/ImageBuilder
 */
import {containsCoordinate, intersects} from '../../extent.js';
import {lineAnchors} from '../../geom/flat/lineanchors.js';
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
     * @type {import('../../style/Image.js').ImageStylePlacement|undefined}
     */
    this.placement_ = undefined;

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
    if (this.placement_ === 'line') {
      const flatCoordinates = lineStringGeometry.getFlatCoordinates();
      const stride = lineStringGeometry.getStride();
      this.drawAnchoredImages_(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
      );
    } else {
      // no line-following rotation: a single icon at the line's own midpoint
      const midpoint = lineStringGeometry.getFlatMidpoint();
      this.drawImageAtCoordinate_([midpoint[0], midpoint[1]], this.rotation_);
    }
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
    if (this.placement_ === 'line') {
      const ends =
        /** @type {import("../../geom/MultiLineString.js").default} */ (
          multiLineStringGeometry
        ).getEnds();
      const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
      const stride = multiLineStringGeometry.getStride();
      let offset = 0;
      for (let i = 0, ii = ends.length; i < ii; ++i) {
        this.drawAnchoredImages_(flatCoordinates, offset, ends[i], stride);
        offset = ends[i];
      }
    } else {
      // no line-following rotation: one icon per sub-line, at its own midpoint
      const midpoints =
        /** @type {import("../../geom/MultiLineString.js").default} */ (
          multiLineStringGeometry
        ).getFlatMidpoints();
      const myBegin = this.coordinates.length;
      const myEnd = this.appendFlatPointCoordinates(midpoints, 2);
      this.appendImageInstruction_(myBegin, myEnd, this.rotation_);
    }
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/Polygon.js").default|import("../Feature.js").default} polygonGeometry Polygon geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawPolygon(polygonGeometry, feature, index) {
    if (!this.image_) {
      return;
    }
    const geometryExtent = polygonGeometry.getExtent();
    if (this.maxExtent && !intersects(this.maxExtent, geometryExtent)) {
      return;
    }
    this.beginGeometry(polygonGeometry, feature, index ?? 0);
    if (this.placement_ === 'line') {
      // only the exterior ring is used for line placement
      const end = /** @type {import("../../geom/Polygon.js").default} */ (
        polygonGeometry
      ).getEnds()[0];
      const flatCoordinates = polygonGeometry.getFlatCoordinates();
      const stride = polygonGeometry.getStride();
      this.drawAnchoredImages_(flatCoordinates, 0, end, stride);
    } else {
      const interiorPoint =
        /** @type {import("../../geom/Polygon.js").default} */ (
          polygonGeometry
        ).getFlatInteriorPoint();
      this.drawImageAtCoordinate_(
        [interiorPoint[0], interiorPoint[1]],
        this.rotation_,
      );
    }
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/MultiPolygon.js").default|import("../Feature.js").default} multiPolygonGeometry MultiPolygon geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} [index] Render order index.
   * @override
   */
  drawMultiPolygon(multiPolygonGeometry, feature, index) {
    if (!this.image_) {
      return;
    }
    const geometryExtent = multiPolygonGeometry.getExtent();
    if (this.maxExtent && !intersects(this.maxExtent, geometryExtent)) {
      return;
    }
    this.beginGeometry(multiPolygonGeometry, feature, index ?? 0);
    if (this.placement_ === 'line') {
      const endss =
        /** @type {import("../../geom/MultiPolygon.js").default} */ (
          multiPolygonGeometry
        ).getEndss();
      const flatCoordinates = multiPolygonGeometry.getFlatCoordinates();
      const stride = multiPolygonGeometry.getStride();
      let offset = 0;
      for (let i = 0, ii = endss.length; i < ii; ++i) {
        // only the exterior ring of each polygon is used for line placement
        const end = endss[i][0];
        this.drawAnchoredImages_(flatCoordinates, offset, end, stride);
        offset = end;
      }
    } else {
      const interiorPoints =
        /** @type {import("../../geom/MultiPolygon.js").default} */ (
          multiPolygonGeometry
        ).getFlatInteriorPoints();
      const midpoints = [];
      for (let i = 0, ii = interiorPoints.length; i < ii; i += 3) {
        midpoints.push(interiorPoints[i], interiorPoints[i + 1]);
      }
      const myBegin = this.coordinates.length;
      const myEnd = this.appendFlatPointCoordinates(midpoints, 2);
      this.appendImageInstruction_(myBegin, myEnd, this.rotation_);
    }
    this.endGeometry(feature);
  }

  /**
   * Compute evenly-spaced anchors (or a single anchor when `repeat_` is not set) along
   * a sub-line, and draw one image per anchor. When `rotateWithView_` is `true` (the
   * default), each image is rotated to follow its own interval's start/end tangent;
   * otherwise every image just keeps the image style's own fixed rotation.
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @private
   */
  drawAnchoredImages_(flatCoordinates, offset, end, stride) {
    const repeatLength = this.repeat_
      ? this.repeat_ * this.resolution
      : Infinity;
    const anchors = lineAnchors(
      repeatLength,
      flatCoordinates,
      offset,
      end,
      stride,
      this.rotateWithView_,
    );
    const step = this.rotateWithView_ ? 3 : 2;
    for (let i = 0, ii = anchors.length; i < ii; i += step) {
      const rotation = this.rotateWithView_ ? anchors[i + 2] : this.rotation_;
      this.drawImageAtCoordinate_([anchors[i], anchors[i + 1]], rotation);
    }
  }

  /**
   * Push one `DRAW_IMAGE` instruction for a single anchor coordinate, using the
   * provided rotation instead of the image style's own fixed rotation.
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate to draw the image at.
   * @param {number|undefined} rotation Rotation (radians).
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
    this.placement_ = undefined;
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
    this.placement_ = imageStyle.getPlacement();
    this.declutterMode_ = imageStyle.getDeclutterMode();
    this.declutterImageWithText_ =
      /** @type {import("../canvas.js").DeclutterImageWithText|undefined} */ (
        sharedData
      );
  }
}

export default CanvasImageBuilder;
