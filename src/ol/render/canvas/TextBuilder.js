/**
 * @module ol/render/canvas/TextBuilder
 */
import {getUid} from '../../util.js';
import {asColorLike} from '../../colorlike.js';
import {intersects} from '../../extent.js';
import {matchingChunk} from '../../geom/flat/straightchunk.js';
import GeometryType from '../../geom/GeometryType.js';
import {labelCache, defaultTextAlign, defaultPadding, defaultLineCap, defaultLineDashOffset, defaultLineDash, defaultLineJoin, defaultFillStyle, checkFont, defaultFont, defaultLineWidth, defaultMiterLimit, defaultStrokeStyle, defaultTextBaseline} from '../canvas.js';
import CanvasInstruction from './Instruction.js';
import CanvasBuilder from './Builder.js';
import TextPlacement from '../../style/TextPlacement.js';
/**
 * @const
 * @enum {number}
 */
export const TEXT_ALIGN = {};
TEXT_ALIGN['left'] = 0;
TEXT_ALIGN['end'] = 0;
TEXT_ALIGN['center'] = 0.5;
TEXT_ALIGN['right'] = 1;
TEXT_ALIGN['start'] = 1;
TEXT_ALIGN['top'] = 0;
TEXT_ALIGN['middle'] = 0.5;
TEXT_ALIGN['hanging'] = 0.2;
TEXT_ALIGN['alphabetic'] = 0.8;
TEXT_ALIGN['ideographic'] = 0.8;
TEXT_ALIGN['bottom'] = 1;


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
     * @type {import("../canvas.js").DeclutterGroup}
     */
    this.declutterGroup_;

    /**
     * @private
     * @type {Array<HTMLCanvasElement>}
     */
    this.labels_ = null;

    /**
     * @private
     * @type {string}
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

    labelCache.prune();
  }

  /**
   * @inheritDoc
   */
  finish() {
    const instructions = super.finish();
    instructions.textStates = this.textStates;
    instructions.fillStates = this.fillStates;
    instructions.strokeStates = this.strokeStates;
    return instructions;
  }

  /**
   * @inheritDoc
   */
  drawText(geometry, feature) {
    const fillState = this.textFillState_;
    const strokeState = this.textStrokeState_;
    const textState = this.textState_;
    if (this.text_ === '' || !textState || (!fillState && !strokeState)) {
      return;
    }

    let begin = this.coordinates.length;

    const geometryType = geometry.getType();
    let flatCoordinates = null;
    let end = 2;
    let stride = 2;
    let i, ii;

    if (textState.placement === TextPlacement.LINE) {
      if (!intersects(this.getBufferedMaxExtent(), geometry.getExtent())) {
        return;
      }
      let ends;
      flatCoordinates = geometry.getFlatCoordinates();
      stride = geometry.getStride();
      if (geometryType == GeometryType.LINE_STRING) {
        ends = [flatCoordinates.length];
      } else if (geometryType == GeometryType.MULTI_LINE_STRING) {
        ends = geometry.getEnds();
      } else if (geometryType == GeometryType.POLYGON) {
        ends = geometry.getEnds().slice(0, 1);
      } else if (geometryType == GeometryType.MULTI_POLYGON) {
        const endss = geometry.getEndss();
        ends = [];
        for (i = 0, ii = endss.length; i < ii; ++i) {
          ends.push(endss[i][0]);
        }
      }
      this.beginGeometry(feature);
      const textAlign = textState.textAlign;
      let flatOffset = 0;
      let flatEnd;
      for (let o = 0, oo = ends.length; o < oo; ++o) {
        if (textAlign == undefined) {
          const range = matchingChunk(textState.maxAngle, flatCoordinates, flatOffset, ends[o], stride);
          flatOffset = range[0];
          flatEnd = range[1];
        } else {
          flatEnd = ends[o];
        }
        for (i = flatOffset; i < flatEnd; i += stride) {
          this.coordinates.push(flatCoordinates[i], flatCoordinates[i + 1]);
        }
        end = this.coordinates.length;
        flatOffset = ends[o];
        this.drawChars_(begin, end, this.declutterGroup_);
        begin = end;
      }
      this.endGeometry(feature);

    } else {

      let geometryWidths = null;
      if (!textState.overflow) {
        geometryWidths = [];
      }
      switch (geometryType) {
        case GeometryType.POINT:
        case GeometryType.MULTI_POINT:
          flatCoordinates = geometry.getFlatCoordinates();
          end = flatCoordinates.length;
          break;
        case GeometryType.LINE_STRING:
          flatCoordinates = /** @type {import("../../geom/LineString.js").default} */ (geometry).getFlatMidpoint();
          break;
        case GeometryType.CIRCLE:
          flatCoordinates = /** @type {import("../../geom/Circle.js").default} */ (geometry).getCenter();
          break;
        case GeometryType.MULTI_LINE_STRING:
          flatCoordinates = /** @type {import("../../geom/MultiLineString.js").default} */ (geometry).getFlatMidpoints();
          end = flatCoordinates.length;
          break;
        case GeometryType.POLYGON:
          flatCoordinates = /** @type {import("../../geom/Polygon.js").default} */ (geometry).getFlatInteriorPoint();
          if (!textState.overflow) {
            geometryWidths.push(flatCoordinates[2] / this.resolution);
          }
          stride = 3;
          break;
        case GeometryType.MULTI_POLYGON:
          const interiorPoints = /** @type {import("../../geom/MultiPolygon.js").default} */ (geometry).getFlatInteriorPoints();
          flatCoordinates = [];
          for (i = 0, ii = interiorPoints.length; i < ii; i += 3) {
            if (!textState.overflow) {
              geometryWidths.push(interiorPoints[i + 2] / this.resolution);
            }
            flatCoordinates.push(interiorPoints[i], interiorPoints[i + 1]);
          }
          end = flatCoordinates.length;
          if (end == 0) {
            return;
          }
          break;
        default:
      }
      end = this.appendFlatCoordinates(flatCoordinates, 0, end, stride, false, false);

      this.saveTextStates_();

      if (textState.backgroundFill || textState.backgroundStroke) {
        this.setFillStrokeStyle(textState.backgroundFill, textState.backgroundStroke);
        if (textState.backgroundFill) {
          this.updateFillStyle(this.state, this.createFill);
          this.hitDetectionInstructions.push(this.createFill(this.state));
        }
        if (textState.backgroundStroke) {
          this.updateStrokeStyle(this.state, this.applyStroke);
          this.hitDetectionInstructions.push(this.createStroke(this.state));
        }
      }

      this.beginGeometry(feature);

      // The image is unknown at this stage so we pass null; it will be computed at render time.
      // For clarity, we pass NaN for offsetX, offsetY, width and height, which will be computed at
      // render time.
      const pixelRatio = this.pixelRatio;
      this.instructions.push([CanvasInstruction.DRAW_IMAGE, begin, end,
        null, NaN, NaN, this.declutterGroup_, NaN, 1, 0, 0,
        this.textRotateWithView_, this.textRotation_, 1, NaN,
        textState.padding == defaultPadding ?
          defaultPadding : textState.padding.map(function(p) {
            return p * pixelRatio;
          }),
        !!textState.backgroundFill, !!textState.backgroundStroke,
        this.text_, this.textKey_, this.strokeKey_, this.fillKey_,
        this.textOffsetX_, this.textOffsetY_, geometryWidths
      ]);
      this.hitDetectionInstructions.push([CanvasInstruction.DRAW_IMAGE, begin, end,
        null, NaN, NaN, this.declutterGroup_, NaN, 1, 0, 0,
        this.textRotateWithView_, this.textRotation_, 1 / this.pixelRatio, NaN,
        textState.padding,
        !!textState.backgroundFill, !!textState.backgroundStroke,
        this.text_, this.textKey_, this.strokeKey_, this.fillKey_,
        this.textOffsetX_, this.textOffsetY_, geometryWidths
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
          lineDash: strokeState.lineDash
        };
      }
    }
    const textKey = this.textKey_;
    if (!(textKey in this.textStates)) {
      this.textStates[textKey] = {
        font: textState.font,
        textAlign: textState.textAlign || defaultTextAlign,
        textBaseline: textState.textBaseline || defaultTextBaseline,
        scale: textState.scale
      };
    }
    const fillKey = this.fillKey_;
    if (fillState) {
      if (!(fillKey in this.fillStates)) {
        this.fillStates[fillKey] = {
          fillStyle: fillState.fillStyle
        };
      }
    }
  }

  /**
   * @private
   * @param {number} begin Begin.
   * @param {number} end End.
   * @param {import("../canvas.js").DeclutterGroup} declutterGroup Declutter group.
   */
  drawChars_(begin, end, declutterGroup) {
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
    const textScale = textState.scale;
    const strokeWidth = strokeState ? strokeState.lineWidth * textScale / 2 : 0;

    this.instructions.push([CanvasInstruction.DRAW_CHARS,
      begin, end, baseline, declutterGroup,
      textState.overflow, fillKey, textState.maxAngle,
      pixelRatio,
      offsetY, strokeKey, strokeWidth * pixelRatio, text, textKey, 1
    ]);
    this.hitDetectionInstructions.push([CanvasInstruction.DRAW_CHARS,
      begin, end, baseline, declutterGroup,
      textState.overflow, fillKey, textState.maxAngle,
      1,
      offsetY, strokeKey, strokeWidth, text, textKey, 1 / pixelRatio
    ]);
  }

  /**
   * @inheritDoc
   */
  setTextStyle(textStyle, declutterGroup) {
    let textState, fillState, strokeState;
    if (!textStyle) {
      this.text_ = '';
    } else {
      this.declutterGroup_ = /** @type {import("../canvas.js").DeclutterGroup} */ (declutterGroup);

      const textFillStyle = textStyle.getFill();
      if (!textFillStyle) {
        fillState = this.textFillState_ = null;
      } else {
        fillState = this.textFillState_;
        if (!fillState) {
          fillState = this.textFillState_ = /** @type {import("../canvas.js").FillState} */ ({});
        }
        fillState.fillStyle = asColorLike(
          textFillStyle.getColor() || defaultFillStyle);
      }

      const textStrokeStyle = textStyle.getStroke();
      if (!textStrokeStyle) {
        strokeState = this.textStrokeState_ = null;
      } else {
        strokeState = this.textStrokeState_;
        if (!strokeState) {
          strokeState = this.textStrokeState_ = /** @type {import("../canvas.js").StrokeState} */ ({});
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
          textStrokeStyle.getColor() || defaultStrokeStyle);
      }

      textState = this.textState_;
      const font = textStyle.getFont() || defaultFont;
      checkFont(font);
      const textScale = textStyle.getScale();
      textState.overflow = textStyle.getOverflow();
      textState.font = font;
      textState.maxAngle = textStyle.getMaxAngle();
      textState.placement = textStyle.getPlacement();
      textState.textAlign = textStyle.getTextAlign();
      textState.textBaseline = textStyle.getTextBaseline() || defaultTextBaseline;
      textState.backgroundFill = textStyle.getBackgroundFill();
      textState.backgroundStroke = textStyle.getBackgroundStroke();
      textState.padding = textStyle.getPadding() || defaultPadding;
      textState.scale = textScale === undefined ? 1 : textScale;

      const textOffsetX = textStyle.getOffsetX();
      const textOffsetY = textStyle.getOffsetY();
      const textRotateWithView = textStyle.getRotateWithView();
      const textRotation = textStyle.getRotation();
      this.text_ = textStyle.getText() || '';
      this.textOffsetX_ = textOffsetX === undefined ? 0 : textOffsetX;
      this.textOffsetY_ = textOffsetY === undefined ? 0 : textOffsetY;
      this.textRotateWithView_ = textRotateWithView === undefined ? false : textRotateWithView;
      this.textRotation_ = textRotation === undefined ? 0 : textRotation;

      this.strokeKey_ = strokeState ?
        (typeof strokeState.strokeStyle == 'string' ? strokeState.strokeStyle : getUid(strokeState.strokeStyle)) +
        strokeState.lineCap + strokeState.lineDashOffset + '|' + strokeState.lineWidth +
        strokeState.lineJoin + strokeState.miterLimit + '[' + strokeState.lineDash.join() + ']' :
        '';
      this.textKey_ = textState.font + textState.scale + (textState.textAlign || '?');
      this.fillKey_ = fillState ?
        (typeof fillState.fillStyle == 'string' ? fillState.fillStyle : ('|' + getUid(fillState.fillStyle))) :
        '';
    }
  }
}


export default CanvasTextBuilder;
