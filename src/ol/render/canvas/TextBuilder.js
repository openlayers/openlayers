/**
 * @module ol/render/canvas/TextBuilder
 */
import CanvasBuilder from './Builder.js';
import CanvasInstruction from './Instruction.js';
import GeometryType from '../../geom/GeometryType.js';
import TextPlacement from '../../style/TextPlacement.js';
import {asColorLike} from '../../colorlike.js';
import {
  defaultFillStyle,
  defaultFont,
  defaultLineCap,
  defaultLineDash,
  defaultLineDashOffset,
  defaultLineJoin,
  defaultLineWidth,
  defaultMiterLimit,
  defaultPadding,
  defaultStrokeStyle,
  defaultTextAlign,
  defaultTextBaseline,
  registerFont,
} from '../canvas.js';
import {getUid} from '../../util.js';
import {intersects} from '../../extent.js';
import {matchingChunk} from '../../geom/flat/straightchunk.js';
/**
 * @const
 * @enum {number}
 */
export const TEXT_ALIGN = {
  'left': 0,
  'end': 0,
  'center': 0.5,
  'right': 1,
  'start': 1,
  'top': 0,
  'middle': 0.5,
  'hanging': 0.2,
  'alphabetic': 0.8,
  'ideographic': 0.8,
  'bottom': 1,
};

class CanvasTextBuilder extends CanvasBuilder {
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
     * @type {Array<HTMLCanvasElement>}
     */
    this.labels_ = null;

    /**
     * @private
     * @type {string|Array<string>}
     */
    this.text_ = '';

    /**
     * @private
     * @type {number}
     */
    this.textOffsetX_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.textOffsetY_ = 0;

    /**
     * @private
     * @type {boolean|undefined}
     */
    this.textRotateWithView_ = undefined;

    /**
     * @private
     * @type {number}
     */
    this.textRotation_ = 0;

    /**
     * @private
     * @type {?import("../canvas.js").FillState}
     */
    this.textFillState_ = null;

    /**
     * @type {!Object<string, import("../canvas.js").FillState>}
     */
    this.fillStates = {};

    /**
     * @private
     * @type {?import("../canvas.js").StrokeState}
     */
    this.textStrokeState_ = null;

    /**
     * @type {!Object<string, import("../canvas.js").StrokeState>}
     */
    this.strokeStates = {};

    /**
     * @private
     * @type {import("../canvas.js").TextState}
     */
    this.textState_ = /** @type {import("../canvas.js").TextState} */ ({});

    /**
     * @type {!Object<string, import("../canvas.js").TextState>}
     */
    this.textStates = {};

    /**
     * @private
     * @type {string}
     */
    this.textKey_ = '';

    /**
     * @private
     * @type {string}
     */
    this.fillKey_ = '';

    /**
     * @private
     * @type {string}
     */
    this.strokeKey_ = '';

    /**
     * Data shared with an image builder for combined decluttering.
     * @private
     * @type {import("../canvas.js").DeclutterImageWithText}
     */
    this.declutterImageWithText_ = undefined;
  }

  /**
   * @return {import("../canvas.js").SerializableInstructions} the serializable instructions.
   */
  finish() {
    const instructions = super.finish();
    instructions.textStates = this.textStates;
    instructions.fillStates = this.fillStates;
    instructions.strokeStates = this.strokeStates;
    return instructions;
  }

  /**
   * @param {import("../../geom/SimpleGeometry.js").default|import("../Feature.js").default} geometry Geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   */
  drawText(geometry, feature) {
    const fillState = this.textFillState_;
    const strokeState = this.textStrokeState_;
    const textState = this.textState_;
    if (this.text_ === '' || !textState || (!fillState && !strokeState)) {
      return;
    }

    const coordinates = this.coordinates;
    let begin = coordinates.length;

    const geometryType = geometry.getType();
    let flatCoordinates = null;
    let stride = geometry.getStride();

    if (
      textState.placement === TextPlacement.LINE &&
      (geometryType == GeometryType.LINE_STRING ||
        geometryType == GeometryType.MULTI_LINE_STRING ||
        geometryType == GeometryType.POLYGON ||
        geometryType == GeometryType.MULTI_POLYGON)
    ) {
      if (!intersects(this.getBufferedMaxExtent(), geometry.getExtent())) {
        return;
      }
      let ends;
      flatCoordinates = geometry.getFlatCoordinates();
      if (geometryType == GeometryType.LINE_STRING) {
        ends = [flatCoordinates.length];
      } else if (geometryType == GeometryType.MULTI_LINE_STRING) {
        ends = /** @type {import("../../geom/MultiLineString.js").default} */ (
          geometry
        ).getEnds();
      } else if (geometryType == GeometryType.POLYGON) {
        ends = /** @type {import("../../geom/Polygon.js").default} */ (geometry)
          .getEnds()
          .slice(0, 1);
      } else if (geometryType == GeometryType.MULTI_POLYGON) {
        const endss =
          /** @type {import("../../geom/MultiPolygon.js").default} */ (
            geometry
          ).getEndss();
        ends = [];
        for (let i = 0, ii = endss.length; i < ii; ++i) {
          ends.push(endss[i][0]);
        }
      }
      this.beginGeometry(geometry, feature);
      const textAlign = textState.textAlign;
      let flatOffset = 0;
      let flatEnd;
      for (let o = 0, oo = ends.length; o < oo; ++o) {
        if (textAlign == undefined) {
          const range = matchingChunk(
            textState.maxAngle,
            flatCoordinates,
            flatOffset,
            ends[o],
            stride
          );
          flatOffset = range[0];
          flatEnd = range[1];
        } else {
          flatEnd = ends[o];
        }
        for (let i = flatOffset; i < flatEnd; i += stride) {
          coordinates.push(flatCoordinates[i], flatCoordinates[i + 1]);
        }
        const end = coordinates.length;
        flatOffset = ends[o];
        this.drawChars_(begin, end);
        begin = end;
      }
      this.endGeometry(feature);
    } else {
      let geometryWidths = textState.overflow ? null : [];
      switch (geometryType) {
        case GeometryType.POINT:
        case GeometryType.MULTI_POINT:
          flatCoordinates =
            /** @type {import("../../geom/MultiPoint.js").default} */ (
              geometry
            ).getFlatCoordinates();
          break;
        case GeometryType.LINE_STRING:
          flatCoordinates =
            /** @type {import("../../geom/LineString.js").default} */ (
              geometry
            ).getFlatMidpoint();
          break;
        case GeometryType.CIRCLE:
          flatCoordinates =
            /** @type {import("../../geom/Circle.js").default} */ (
              geometry
            ).getCenter();
          break;
        case GeometryType.MULTI_LINE_STRING:
          flatCoordinates =
            /** @type {import("../../geom/MultiLineString.js").default} */ (
              geometry
            ).getFlatMidpoints();
          stride = 2;
          break;
        case GeometryType.POLYGON:
          flatCoordinates =
            /** @type {import("../../geom/Polygon.js").default} */ (
              geometry
            ).getFlatInteriorPoint();
          if (!textState.overflow) {
            geometryWidths.push(flatCoordinates[2] / this.resolution);
          }
          stride = 3;
          break;
        case GeometryType.MULTI_POLYGON:
          const interiorPoints =
            /** @type {import("../../geom/MultiPolygon.js").default} */ (
              geometry
            ).getFlatInteriorPoints();
          flatCoordinates = [];
          for (let i = 0, ii = interiorPoints.length; i < ii; i += 3) {
            if (!textState.overflow) {
              geometryWidths.push(interiorPoints[i + 2] / this.resolution);
            }
            flatCoordinates.push(interiorPoints[i], interiorPoints[i + 1]);
          }
          if (flatCoordinates.length === 0) {
            return;
          }
          stride = 2;
          break;
        default:
      }
      const end = this.appendFlatPointCoordinates(flatCoordinates, stride);
      if (end === begin) {
        return;
      }
      if (
        geometryWidths &&
        (end - begin) / 2 !== flatCoordinates.length / stride
      ) {
        let beg = begin / 2;
        geometryWidths = geometryWidths.filter((w, i) => {
          const keep =
            coordinates[(beg + i) * 2] === flatCoordinates[i * stride] &&
            coordinates[(beg + i) * 2 + 1] === flatCoordinates[i * stride + 1];
          if (!keep) {
            --beg;
          }
          return keep;
        });
      }

      this.saveTextStates_();

      if (textState.backgroundFill || textState.backgroundStroke) {
        this.setFillStrokeStyle(
          textState.backgroundFill,
          textState.backgroundStroke
        );
        if (textState.backgroundFill) {
          this.updateFillStyle(this.state, this.createFill);
          this.hitDetectionInstructions.push(this.createFill(this.state));
        }
        if (textState.backgroundStroke) {
          this.updateStrokeStyle(this.state, this.applyStroke);
          this.hitDetectionInstructions.push(this.createStroke(this.state));
        }
      }

      this.beginGeometry(geometry, feature);

      // adjust padding for negative scale
      let padding = textState.padding;
      if (
        padding != defaultPadding &&
        (textState.scale[0] < 0 || textState.scale[1] < 0)
      ) {
        let p0 = textState.padding[0];
        let p1 = textState.padding[1];
        let p2 = textState.padding[2];
        let p3 = textState.padding[3];
        if (textState.scale[0] < 0) {
          p1 = -p1;
          p3 = -p3;
        }
        if (textState.scale[1] < 0) {
          p0 = -p0;
          p2 = -p2;
        }
        padding = [p0, p1, p2, p3];
      }

      // The image is unknown at this stage so we pass null; it will be computed at render time.
      // For clarity, we pass NaN for offsetX, offsetY, width and height, which will be computed at
      // render time.
      const pixelRatio = this.pixelRatio;
      this.instructions.push([
        CanvasInstruction.DRAW_IMAGE,
        begin,
        end,
        null,
        NaN,
        NaN,
        NaN,
        1,
        0,
        0,
        this.textRotateWithView_,
        this.textRotation_,
        [1, 1],
        NaN,
        this.declutterImageWithText_,
        padding == defaultPadding
          ? defaultPadding
          : padding.map(function (p) {
              return p * pixelRatio;
            }),
        !!textState.backgroundFill,
        !!textState.backgroundStroke,
        this.text_,
        this.textKey_,
        this.strokeKey_,
        this.fillKey_,
        this.textOffsetX_,
        this.textOffsetY_,
        geometryWidths,
      ]);
      const scale = 1 / pixelRatio;
      this.hitDetectionInstructions.push([
        CanvasInstruction.DRAW_IMAGE,
        begin,
        end,
        null,
        NaN,
        NaN,
        NaN,
        1,
        0,
        0,
        this.textRotateWithView_,
        this.textRotation_,
        [scale, scale],
        NaN,
        this.declutterImageWithText_,
        padding,
        !!textState.backgroundFill,
        !!textState.backgroundStroke,
        this.text_,
        this.textKey_,
        this.strokeKey_,
        this.fillKey_,
        this.textOffsetX_,
        this.textOffsetY_,
        geometryWidths,
      ]);

      this.endGeometry(feature);
    }
  }

  /**
   * @private
   */
  saveTextStates_() {
    const strokeState = this.textStrokeState_;
    const textState = this.textState_;
    const fillState = this.textFillState_;

    const strokeKey = this.strokeKey_;
    if (strokeState) {
      if (!(strokeKey in this.strokeStates)) {
        this.strokeStates[strokeKey] = {
          strokeStyle: strokeState.strokeStyle,
          lineCap: strokeState.lineCap,
          lineDashOffset: strokeState.lineDashOffset,
          lineWidth: strokeState.lineWidth,
          lineJoin: strokeState.lineJoin,
          miterLimit: strokeState.miterLimit,
          lineDash: strokeState.lineDash,
        };
      }
    }
    const textKey = this.textKey_;
    if (!(textKey in this.textStates)) {
      this.textStates[textKey] = {
        font: textState.font,
        textAlign: textState.textAlign || defaultTextAlign,
        textBaseline: textState.textBaseline || defaultTextBaseline,
        scale: textState.scale,
      };
    }
    const fillKey = this.fillKey_;
    if (fillState) {
      if (!(fillKey in this.fillStates)) {
        this.fillStates[fillKey] = {
          fillStyle: fillState.fillStyle,
        };
      }
    }
  }

  /**
   * @private
   * @param {number} begin Begin.
   * @param {number} end End.
   */
  drawChars_(begin, end) {
    const strokeState = this.textStrokeState_;
    const textState = this.textState_;

    const strokeKey = this.strokeKey_;
    const textKey = this.textKey_;
    const fillKey = this.fillKey_;
    this.saveTextStates_();

    const pixelRatio = this.pixelRatio;
    const baseline = TEXT_ALIGN[textState.textBaseline];

    const offsetY = this.textOffsetY_ * pixelRatio;
    const text = this.text_;
    const strokeWidth = strokeState
      ? (strokeState.lineWidth * Math.abs(textState.scale[0])) / 2
      : 0;

    this.instructions.push([
      CanvasInstruction.DRAW_CHARS,
      begin,
      end,
      baseline,
      textState.overflow,
      fillKey,
      textState.maxAngle,
      pixelRatio,
      offsetY,
      strokeKey,
      strokeWidth * pixelRatio,
      text,
      textKey,
      1,
    ]);
    this.hitDetectionInstructions.push([
      CanvasInstruction.DRAW_CHARS,
      begin,
      end,
      baseline,
      textState.overflow,
      fillKey,
      textState.maxAngle,
      1,
      offsetY,
      strokeKey,
      strokeWidth,
      text,
      textKey,
      1 / pixelRatio,
    ]);
  }

  /**
   * @param {import("../../style/Text.js").default} textStyle Text style.
   * @param {Object} [opt_sharedData] Shared data.
   */
  setTextStyle(textStyle, opt_sharedData) {
    let textState, fillState, strokeState;
    if (!textStyle) {
      this.text_ = '';
    } else {
      const textFillStyle = textStyle.getFill();
      if (!textFillStyle) {
        fillState = null;
        this.textFillState_ = fillState;
      } else {
        fillState = this.textFillState_;
        if (!fillState) {
          fillState = /** @type {import("../canvas.js").FillState} */ ({});
          this.textFillState_ = fillState;
        }
        fillState.fillStyle = asColorLike(
          textFillStyle.getColor() || defaultFillStyle
        );
      }

      const textStrokeStyle = textStyle.getStroke();
      if (!textStrokeStyle) {
        strokeState = null;
        this.textStrokeState_ = strokeState;
      } else {
        strokeState = this.textStrokeState_;
        if (!strokeState) {
          strokeState = /** @type {import("../canvas.js").StrokeState} */ ({});
          this.textStrokeState_ = strokeState;
        }
        const lineDash = textStrokeStyle.getLineDash();
        const lineDashOffset = textStrokeStyle.getLineDashOffset();
        const lineWidth = textStrokeStyle.getWidth();
        const miterLimit = textStrokeStyle.getMiterLimit();
        strokeState.lineCap = textStrokeStyle.getLineCap() || defaultLineCap;
        strokeState.lineDash = lineDash ? lineDash.slice() : defaultLineDash;
        strokeState.lineDashOffset =
          lineDashOffset === undefined ? defaultLineDashOffset : lineDashOffset;
        strokeState.lineJoin = textStrokeStyle.getLineJoin() || defaultLineJoin;
        strokeState.lineWidth =
          lineWidth === undefined ? defaultLineWidth : lineWidth;
        strokeState.miterLimit =
          miterLimit === undefined ? defaultMiterLimit : miterLimit;
        strokeState.strokeStyle = asColorLike(
          textStrokeStyle.getColor() || defaultStrokeStyle
        );
      }

      textState = this.textState_;
      const font = textStyle.getFont() || defaultFont;
      registerFont(font);
      const textScale = textStyle.getScaleArray();
      textState.overflow = textStyle.getOverflow();
      textState.font = font;
      textState.maxAngle = textStyle.getMaxAngle();
      textState.placement = textStyle.getPlacement();
      textState.textAlign = textStyle.getTextAlign();
      textState.textBaseline =
        textStyle.getTextBaseline() || defaultTextBaseline;
      textState.backgroundFill = textStyle.getBackgroundFill();
      textState.backgroundStroke = textStyle.getBackgroundStroke();
      textState.padding = textStyle.getPadding() || defaultPadding;
      textState.scale = textScale === undefined ? [1, 1] : textScale;

      const textOffsetX = textStyle.getOffsetX();
      const textOffsetY = textStyle.getOffsetY();
      const textRotateWithView = textStyle.getRotateWithView();
      const textRotation = textStyle.getRotation();
      this.text_ = textStyle.getText() || '';
      this.textOffsetX_ = textOffsetX === undefined ? 0 : textOffsetX;
      this.textOffsetY_ = textOffsetY === undefined ? 0 : textOffsetY;
      this.textRotateWithView_ =
        textRotateWithView === undefined ? false : textRotateWithView;
      this.textRotation_ = textRotation === undefined ? 0 : textRotation;

      this.strokeKey_ = strokeState
        ? (typeof strokeState.strokeStyle == 'string'
            ? strokeState.strokeStyle
            : getUid(strokeState.strokeStyle)) +
          strokeState.lineCap +
          strokeState.lineDashOffset +
          '|' +
          strokeState.lineWidth +
          strokeState.lineJoin +
          strokeState.miterLimit +
          '[' +
          strokeState.lineDash.join() +
          ']'
        : '';
      this.textKey_ =
        textState.font +
        textState.scale +
        (textState.textAlign || '?') +
        (textState.textBaseline || '?');
      this.fillKey_ = fillState
        ? typeof fillState.fillStyle == 'string'
          ? fillState.fillStyle
          : '|' + getUid(fillState.fillStyle)
        : '';
    }
    this.declutterImageWithText_ = opt_sharedData;
  }
}

export default CanvasTextBuilder;
