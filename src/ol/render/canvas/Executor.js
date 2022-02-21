/**
 * @module ol/render/canvas/Executor
 */
import CanvasInstruction from './Instruction.js';
import {TEXT_ALIGN} from './TextBuilder.js';
import {WORKER_OFFSCREEN_CANVAS} from '../../has.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  create as createTransform,
  setFromArray as transformSetFromArray,
} from '../../transform.js';
import {createEmpty, createOrUpdate, intersects} from '../../extent.js';
import {
  defaultPadding,
  defaultTextAlign,
  defaultTextBaseline,
  drawImageOrLabel,
  getTextDimensions,
  measureAndCacheTextWidth,
} from '../canvas.js';
import {drawTextOnPath} from '../../geom/flat/textpath.js';
import {equals} from '../../array.js';
import {lineStringLength} from '../../geom/flat/length.js';
import {transform2D} from '../../geom/flat/transform.js';

/**
 * @typedef {Object} BBox
 * @property {number} minX Minimal x.
 * @property {number} minY Minimal y.
 * @property {number} maxX Maximal x.
 * @property {number} maxY Maximal y
 * @property {*} value Value.
 */

/**
 * @typedef {Object} ImageOrLabelDimensions
 * @property {number} drawImageX DrawImageX.
 * @property {number} drawImageY DrawImageY.
 * @property {number} drawImageW DrawImageW.
 * @property {number} drawImageH DrawImageH.
 * @property {number} originX OriginX.
 * @property {number} originY OriginY.
 * @property {Array<number>} scale Scale.
 * @property {BBox} declutterBox DeclutterBox.
 * @property {import("../../transform.js").Transform} canvasTransform CanvasTransform.
 */

/**
 * @typedef {{0: CanvasRenderingContext2D, 1: number, 2: import("../canvas.js").Label|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement, 3: ImageOrLabelDimensions, 4: number, 5: Array<*>, 6: Array<*>}} ReplayImageOrLabelArgs
 */

/**
 * @template T
 * @typedef {function(import("../../Feature.js").FeatureLike, import("../../geom/SimpleGeometry.js").default): T} FeatureCallback
 */

/**
 * @type {import("../../extent.js").Extent}
 */
const tmpExtent = createEmpty();

/** @type {import("../../coordinate.js").Coordinate} */
const p1 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p2 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p3 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p4 = [];

/**
 * @param {ReplayImageOrLabelArgs} replayImageOrLabelArgs Arguments to replayImageOrLabel
 * @return {BBox} Declutter bbox.
 */
function getDeclutterBox(replayImageOrLabelArgs) {
  return replayImageOrLabelArgs[3].declutterBox;
}

const rtlRegEx = new RegExp(
  /* eslint-disable prettier/prettier */
  '[' +
    String.fromCharCode(0x00591) + '-' + String.fromCharCode(0x008ff) +
    String.fromCharCode(0x0fb1d) + '-' + String.fromCharCode(0x0fdff) +
    String.fromCharCode(0x0fe70) + '-' + String.fromCharCode(0x0fefc) +
    String.fromCharCode(0x10800) + '-' + String.fromCharCode(0x10fff) +
    String.fromCharCode(0x1e800) + '-' + String.fromCharCode(0x1efff) +
  ']'
  /* eslint-enable prettier/prettier */
);

/**
 * @param {string} text Text.
 * @param {string} align Alignment.
 * @return {number} Text alignment.
 */
function horizontalTextAlign(text, align) {
  if ((align === 'start' || align === 'end') && !rtlRegEx.test(text)) {
    align = align === 'start' ? 'left' : 'right';
  }
  return TEXT_ALIGN[align];
}

/**
 * @param {Array<string>} acc Accumulator.
 * @param {string} line Line of text.
 * @param {number} i Index
 * @return {Array<string>} Accumulator.
 */
function createTextChunks(acc, line, i) {
  if (i > 0) {
    acc.push('\n', '');
  }
  acc.push(line, '');
  return acc;
}

class Executor {
  /**
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {boolean} overlaps The replay can have overlapping geometries.
   * @param {import("../canvas.js").SerializableInstructions} instructions The serializable instructions
   */
  constructor(resolution, pixelRatio, overlaps, instructions) {
    /**
     * @protected
     * @type {boolean}
     */
    this.overlaps = overlaps;

    /**
     * @protected
     * @type {number}
     */
    this.pixelRatio = pixelRatio;

    /**
     * @protected
     * @const
     * @type {number}
     */
    this.resolution = resolution;

    /**
     * @private
     * @type {boolean}
     */
    this.alignFill_;

    /**
     * @protected
     * @type {Array<*>}
     */
    this.instructions = instructions.instructions;

    /**
     * @protected
     * @type {Array<number>}
     */
    this.coordinates = instructions.coordinates;

    /**
     * @private
     * @type {!Object<number,import("../../coordinate.js").Coordinate|Array<import("../../coordinate.js").Coordinate>|Array<Array<import("../../coordinate.js").Coordinate>>>}
     */
    this.coordinateCache_ = {};

    /**
     * @private
     * @type {!import("../../transform.js").Transform}
     */
    this.renderedTransform_ = createTransform();

    /**
     * @protected
     * @type {Array<*>}
     */
    this.hitDetectionInstructions = instructions.hitDetectionInstructions;

    /**
     * @private
     * @type {Array<number>}
     */
    this.pixelCoordinates_ = null;

    /**
     * @private
     * @type {number}
     */
    this.viewRotation_ = 0;

    /**
     * @type {!Object<string, import("../canvas.js").FillState>}
     */
    this.fillStates = instructions.fillStates || {};

    /**
     * @type {!Object<string, import("../canvas.js").StrokeState>}
     */
    this.strokeStates = instructions.strokeStates || {};

    /**
     * @type {!Object<string, import("../canvas.js").TextState>}
     */
    this.textStates = instructions.textStates || {};

    /**
     * @private
     * @type {Object<string, Object<string, number>>}
     */
    this.widths_ = {};

    /**
     * @private
     * @type {Object<string, import("../canvas.js").Label>}
     */
    this.labels_ = {};
  }

  /**
   * @param {string|Array<string>} text Text.
   * @param {string} textKey Text style key.
   * @param {string} fillKey Fill style key.
   * @param {string} strokeKey Stroke style key.
   * @return {import("../canvas.js").Label} Label.
   */
  createLabel(text, textKey, fillKey, strokeKey) {
    const key = text + textKey + fillKey + strokeKey;
    if (this.labels_[key]) {
      return this.labels_[key];
    }
    const strokeState = strokeKey ? this.strokeStates[strokeKey] : null;
    const fillState = fillKey ? this.fillStates[fillKey] : null;
    const textState = this.textStates[textKey];
    const pixelRatio = this.pixelRatio;
    const scale = [
      textState.scale[0] * pixelRatio,
      textState.scale[1] * pixelRatio,
    ];
    const textIsArray = Array.isArray(text);
    const align = horizontalTextAlign(
      textIsArray ? text[0] : text,
      textState.textAlign || defaultTextAlign
    );
    const strokeWidth =
      strokeKey && strokeState.lineWidth ? strokeState.lineWidth : 0;

    const chunks = textIsArray
      ? text
      : text.split('\n').reduce(createTextChunks, []);

    const {width, height, widths, heights, lineWidths} = getTextDimensions(
      textState,
      chunks
    );
    const renderWidth = width + strokeWidth;
    const contextInstructions = [];
    // make canvas 2 pixels wider to account for italic text width measurement errors
    const w = (renderWidth + 2) * scale[0];
    const h = (height + strokeWidth) * scale[1];
    /** @type {import("../canvas.js").Label} */
    const label = {
      width: w < 0 ? Math.floor(w) : Math.ceil(w),
      height: h < 0 ? Math.floor(h) : Math.ceil(h),
      contextInstructions: contextInstructions,
    };
    if (scale[0] != 1 || scale[1] != 1) {
      contextInstructions.push('scale', scale);
    }
    if (strokeKey) {
      contextInstructions.push('strokeStyle', strokeState.strokeStyle);
      contextInstructions.push('lineWidth', strokeWidth);
      contextInstructions.push('lineCap', strokeState.lineCap);
      contextInstructions.push('lineJoin', strokeState.lineJoin);
      contextInstructions.push('miterLimit', strokeState.miterLimit);
      // eslint-disable-next-line
      const Context = WORKER_OFFSCREEN_CANVAS ? OffscreenCanvasRenderingContext2D : CanvasRenderingContext2D;
      if (Context.prototype.setLineDash) {
        contextInstructions.push('setLineDash', [strokeState.lineDash]);
        contextInstructions.push('lineDashOffset', strokeState.lineDashOffset);
      }
    }
    if (fillKey) {
      contextInstructions.push('fillStyle', fillState.fillStyle);
    }
    contextInstructions.push('textBaseline', 'middle');
    contextInstructions.push('textAlign', 'center');
    const leftRight = 0.5 - align;
    let x = align * renderWidth + leftRight * strokeWidth;
    const strokeInstructions = [];
    const fillInstructions = [];
    let lineHeight = 0;
    let lineOffset = 0;
    let widthHeightIndex = 0;
    let lineWidthIndex = 0;
    let previousFont;
    for (let i = 0, ii = chunks.length; i < ii; i += 2) {
      const text = chunks[i];
      if (text === '\n') {
        lineOffset += lineHeight;
        lineHeight = 0;
        x = align * renderWidth + leftRight * strokeWidth;
        ++lineWidthIndex;
        continue;
      }
      const font = chunks[i + 1] || textState.font;
      if (font !== previousFont) {
        if (strokeKey) {
          strokeInstructions.push('font', font);
        }
        if (fillKey) {
          fillInstructions.push('font', font);
        }
        previousFont = font;
      }
      lineHeight = Math.max(lineHeight, heights[widthHeightIndex]);
      const fillStrokeArgs = [
        text,
        x +
          leftRight * widths[widthHeightIndex] +
          align * (widths[widthHeightIndex] - lineWidths[lineWidthIndex]),
        0.5 * (strokeWidth + lineHeight) + lineOffset,
      ];
      x += widths[widthHeightIndex];
      if (strokeKey) {
        strokeInstructions.push('strokeText', fillStrokeArgs);
      }
      if (fillKey) {
        fillInstructions.push('fillText', fillStrokeArgs);
      }
      ++widthHeightIndex;
    }
    Array.prototype.push.apply(contextInstructions, strokeInstructions);
    Array.prototype.push.apply(contextInstructions, fillInstructions);
    this.labels_[key] = label;
    return label;
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../coordinate.js").Coordinate} p1 1st point of the background box.
   * @param {import("../../coordinate.js").Coordinate} p2 2nd point of the background box.
   * @param {import("../../coordinate.js").Coordinate} p3 3rd point of the background box.
   * @param {import("../../coordinate.js").Coordinate} p4 4th point of the background box.
   * @param {Array<*>} fillInstruction Fill instruction.
   * @param {Array<*>} strokeInstruction Stroke instruction.
   */
  replayTextBackground_(
    context,
    p1,
    p2,
    p3,
    p4,
    fillInstruction,
    strokeInstruction
  ) {
    context.beginPath();
    context.moveTo.apply(context, p1);
    context.lineTo.apply(context, p2);
    context.lineTo.apply(context, p3);
    context.lineTo.apply(context, p4);
    context.lineTo.apply(context, p1);
    if (fillInstruction) {
      this.alignFill_ = /** @type {boolean} */ (fillInstruction[2]);
      this.fill_(context);
    }
    if (strokeInstruction) {
      this.setStrokeStyle_(
        context,
        /** @type {Array<*>} */ (strokeInstruction)
      );
      context.stroke();
    }
  }

  /**
   * @private
   * @param {number} sheetWidth Width of the sprite sheet.
   * @param {number} sheetHeight Height of the sprite sheet.
   * @param {number} centerX X.
   * @param {number} centerY Y.
   * @param {number} width Width.
   * @param {number} height Height.
   * @param {number} anchorX Anchor X.
   * @param {number} anchorY Anchor Y.
   * @param {number} originX Origin X.
   * @param {number} originY Origin Y.
   * @param {number} rotation Rotation.
   * @param {import("../../size.js").Size} scale Scale.
   * @param {boolean} snapToPixel Snap to pixel.
   * @param {Array<number>} padding Padding.
   * @param {boolean} fillStroke Background fill or stroke.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @return {ImageOrLabelDimensions} Dimensions for positioning and decluttering the image or label.
   */
  calculateImageOrLabelDimensions_(
    sheetWidth,
    sheetHeight,
    centerX,
    centerY,
    width,
    height,
    anchorX,
    anchorY,
    originX,
    originY,
    rotation,
    scale,
    snapToPixel,
    padding,
    fillStroke,
    feature
  ) {
    anchorX *= scale[0];
    anchorY *= scale[1];
    let x = centerX - anchorX;
    let y = centerY - anchorY;

    const w = width + originX > sheetWidth ? sheetWidth - originX : width;
    const h = height + originY > sheetHeight ? sheetHeight - originY : height;
    const boxW = padding[3] + w * scale[0] + padding[1];
    const boxH = padding[0] + h * scale[1] + padding[2];
    const boxX = x - padding[3];
    const boxY = y - padding[0];

    if (fillStroke || rotation !== 0) {
      p1[0] = boxX;
      p4[0] = boxX;
      p1[1] = boxY;
      p2[1] = boxY;
      p2[0] = boxX + boxW;
      p3[0] = p2[0];
      p3[1] = boxY + boxH;
      p4[1] = p3[1];
    }

    let transform;
    if (rotation !== 0) {
      transform = composeTransform(
        createTransform(),
        centerX,
        centerY,
        1,
        1,
        rotation,
        -centerX,
        -centerY
      );

      applyTransform(transform, p1);
      applyTransform(transform, p2);
      applyTransform(transform, p3);
      applyTransform(transform, p4);
      createOrUpdate(
        Math.min(p1[0], p2[0], p3[0], p4[0]),
        Math.min(p1[1], p2[1], p3[1], p4[1]),
        Math.max(p1[0], p2[0], p3[0], p4[0]),
        Math.max(p1[1], p2[1], p3[1], p4[1]),
        tmpExtent
      );
    } else {
      createOrUpdate(
        Math.min(boxX, boxX + boxW),
        Math.min(boxY, boxY + boxH),
        Math.max(boxX, boxX + boxW),
        Math.max(boxY, boxY + boxH),
        tmpExtent
      );
    }
    if (snapToPixel) {
      x = Math.round(x);
      y = Math.round(y);
    }
    return {
      drawImageX: x,
      drawImageY: y,
      drawImageW: w,
      drawImageH: h,
      originX: originX,
      originY: originY,
      declutterBox: {
        minX: tmpExtent[0],
        minY: tmpExtent[1],
        maxX: tmpExtent[2],
        maxY: tmpExtent[3],
        value: feature,
      },
      canvasTransform: transform,
      scale: scale,
    };
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   * @param {number} contextScale Scale of the context.
   * @param {import("../canvas.js").Label|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageOrLabel Image.
   * @param {ImageOrLabelDimensions} dimensions Dimensions.
   * @param {number} opacity Opacity.
   * @param {Array<*>} fillInstruction Fill instruction.
   * @param {Array<*>} strokeInstruction Stroke instruction.
   * @return {boolean} The image or label was rendered.
   */
  replayImageOrLabel_(
    context,
    contextScale,
    imageOrLabel,
    dimensions,
    opacity,
    fillInstruction,
    strokeInstruction
  ) {
    const fillStroke = !!(fillInstruction || strokeInstruction);

    const box = dimensions.declutterBox;
    const canvas = context.canvas;
    const strokePadding = strokeInstruction
      ? (strokeInstruction[2] * dimensions.scale[0]) / 2
      : 0;
    const intersects =
      box.minX - strokePadding <= canvas.width / contextScale &&
      box.maxX + strokePadding >= 0 &&
      box.minY - strokePadding <= canvas.height / contextScale &&
      box.maxY + strokePadding >= 0;

    if (intersects) {
      if (fillStroke) {
        this.replayTextBackground_(
          context,
          p1,
          p2,
          p3,
          p4,
          /** @type {Array<*>} */ (fillInstruction),
          /** @type {Array<*>} */ (strokeInstruction)
        );
      }
      drawImageOrLabel(
        context,
        dimensions.canvasTransform,
        opacity,
        imageOrLabel,
        dimensions.originX,
        dimensions.originY,
        dimensions.drawImageW,
        dimensions.drawImageH,
        dimensions.drawImageX,
        dimensions.drawImageY,
        dimensions.scale
      );
    }
    return true;
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   */
  fill_(context) {
    if (this.alignFill_) {
      const origin = applyTransform(this.renderedTransform_, [0, 0]);
      const repeatSize = 512 * this.pixelRatio;
      context.save();
      context.translate(origin[0] % repeatSize, origin[1] % repeatSize);
      context.rotate(this.viewRotation_);
    }
    context.fill();
    if (this.alignFill_) {
      context.restore();
    }
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   * @param {Array<*>} instruction Instruction.
   */
  setStrokeStyle_(context, instruction) {
    context['strokeStyle'] =
      /** @type {import("../../colorlike.js").ColorLike} */ (instruction[1]);
    context.lineWidth = /** @type {number} */ (instruction[2]);
    context.lineCap = /** @type {CanvasLineCap} */ (instruction[3]);
    context.lineJoin = /** @type {CanvasLineJoin} */ (instruction[4]);
    context.miterLimit = /** @type {number} */ (instruction[5]);
    if (context.setLineDash) {
      context.lineDashOffset = /** @type {number} */ (instruction[7]);
      context.setLineDash(/** @type {Array<number>} */ (instruction[6]));
    }
  }

  /**
   * @private
   * @param {string|Array<string>} text The text to draw.
   * @param {string} textKey The key of the text state.
   * @param {string} strokeKey The key for the stroke state.
   * @param {string} fillKey The key for the fill state.
   * @return {{label: import("../canvas.js").Label, anchorX: number, anchorY: number}} The text image and its anchor.
   */
  drawLabelWithPointPlacement_(text, textKey, strokeKey, fillKey) {
    const textState = this.textStates[textKey];

    const label = this.createLabel(text, textKey, fillKey, strokeKey);

    const strokeState = this.strokeStates[strokeKey];
    const pixelRatio = this.pixelRatio;
    const align = horizontalTextAlign(
      Array.isArray(text) ? text[0] : text,
      textState.textAlign || defaultTextAlign
    );
    const baseline = TEXT_ALIGN[textState.textBaseline || defaultTextBaseline];
    const strokeWidth =
      strokeState && strokeState.lineWidth ? strokeState.lineWidth : 0;

    // Remove the 2 pixels we added in createLabel() for the anchor
    const width = label.width / pixelRatio - 2 * textState.scale[0];
    const anchorX = align * width + 2 * (0.5 - align) * strokeWidth;
    const anchorY =
      (baseline * label.height) / pixelRatio +
      2 * (0.5 - baseline) * strokeWidth;

    return {
      label: label,
      anchorX: anchorX,
      anchorY: anchorY,
    };
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   * @param {number} contextScale Scale of the context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {Array<*>} instructions Instructions array.
   * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
   * @param {FeatureCallback<T>} [opt_featureCallback] Feature callback.
   * @param {import("../../extent.js").Extent} [opt_hitExtent] Only check
   *     features that intersect this extent.
   * @param {import("rbush").default} [opt_declutterTree] Declutter tree.
   * @return {T|undefined} Callback result.
   * @template T
   */
  execute_(
    context,
    contextScale,
    transform,
    instructions,
    snapToPixel,
    opt_featureCallback,
    opt_hitExtent,
    opt_declutterTree
  ) {
    /** @type {Array<number>} */
    let pixelCoordinates;
    if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
      pixelCoordinates = this.pixelCoordinates_;
    } else {
      if (!this.pixelCoordinates_) {
        this.pixelCoordinates_ = [];
      }
      pixelCoordinates = transform2D(
        this.coordinates,
        0,
        this.coordinates.length,
        2,
        transform,
        this.pixelCoordinates_
      );
      transformSetFromArray(this.renderedTransform_, transform);
    }
    let i = 0; // instruction index
    const ii = instructions.length; // end of instructions
    let d = 0; // data index
    let dd; // end of per-instruction data
    let anchorX,
      anchorY,
      prevX,
      prevY,
      roundX,
      roundY,
      image,
      text,
      textKey,
      strokeKey,
      fillKey;
    let pendingFill = 0;
    let pendingStroke = 0;
    let lastFillInstruction = null;
    let lastStrokeInstruction = null;
    const coordinateCache = this.coordinateCache_;
    const viewRotation = this.viewRotation_;
    const viewRotationFromTransform =
      Math.round(Math.atan2(-transform[1], transform[0]) * 1e12) / 1e12;

    const state = /** @type {import("../../render.js").State} */ ({
      context: context,
      pixelRatio: this.pixelRatio,
      resolution: this.resolution,
      rotation: viewRotation,
    });

    // When the batch size gets too big, performance decreases. 200 is a good
    // balance between batch size and number of fill/stroke instructions.
    const batchSize =
      this.instructions != instructions || this.overlaps ? 0 : 200;
    let /** @type {import("../../Feature.js").FeatureLike} */ feature;
    let x, y, currentGeometry;
    while (i < ii) {
      const instruction = instructions[i];
      const type = /** @type {import("./Instruction.js").default} */ (
        instruction[0]
      );
      switch (type) {
        case CanvasInstruction.BEGIN_GEOMETRY:
          feature = /** @type {import("../../Feature.js").FeatureLike} */ (
            instruction[1]
          );
          currentGeometry = instruction[3];
          if (!feature.getGeometry()) {
            i = /** @type {number} */ (instruction[2]);
          } else if (
            opt_hitExtent !== undefined &&
            !intersects(opt_hitExtent, currentGeometry.getExtent())
          ) {
            i = /** @type {number} */ (instruction[2]) + 1;
          } else {
            ++i;
          }
          break;
        case CanvasInstruction.BEGIN_PATH:
          if (pendingFill > batchSize) {
            this.fill_(context);
            pendingFill = 0;
          }
          if (pendingStroke > batchSize) {
            context.stroke();
            pendingStroke = 0;
          }
          if (!pendingFill && !pendingStroke) {
            context.beginPath();
            prevX = NaN;
            prevY = NaN;
          }
          ++i;
          break;
        case CanvasInstruction.CIRCLE:
          d = /** @type {number} */ (instruction[1]);
          const x1 = pixelCoordinates[d];
          const y1 = pixelCoordinates[d + 1];
          const x2 = pixelCoordinates[d + 2];
          const y2 = pixelCoordinates[d + 3];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const r = Math.sqrt(dx * dx + dy * dy);
          context.moveTo(x1 + r, y1);
          context.arc(x1, y1, r, 0, 2 * Math.PI, true);
          ++i;
          break;
        case CanvasInstruction.CLOSE_PATH:
          context.closePath();
          ++i;
          break;
        case CanvasInstruction.CUSTOM:
          d = /** @type {number} */ (instruction[1]);
          dd = instruction[2];
          const geometry =
            /** @type {import("../../geom/SimpleGeometry.js").default} */ (
              instruction[3]
            );
          const renderer = instruction[4];
          const fn = instruction.length == 6 ? instruction[5] : undefined;
          state.geometry = geometry;
          state.feature = feature;
          if (!(i in coordinateCache)) {
            coordinateCache[i] = [];
          }
          const coords = coordinateCache[i];
          if (fn) {
            fn(pixelCoordinates, d, dd, 2, coords);
          } else {
            coords[0] = pixelCoordinates[d];
            coords[1] = pixelCoordinates[d + 1];
            coords.length = 2;
          }
          renderer(coords, state);
          ++i;
          break;
        case CanvasInstruction.DRAW_IMAGE:
          d = /** @type {number} */ (instruction[1]);
          dd = /** @type {number} */ (instruction[2]);
          image =
            /** @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} */ (
              instruction[3]
            );

          // Remaining arguments in DRAW_IMAGE are in alphabetical order
          anchorX = /** @type {number} */ (instruction[4]);
          anchorY = /** @type {number} */ (instruction[5]);
          let height = /** @type {number} */ (instruction[6]);
          const opacity = /** @type {number} */ (instruction[7]);
          const originX = /** @type {number} */ (instruction[8]);
          const originY = /** @type {number} */ (instruction[9]);
          const rotateWithView = /** @type {boolean} */ (instruction[10]);
          let rotation = /** @type {number} */ (instruction[11]);
          const scale = /** @type {import("../../size.js").Size} */ (
            instruction[12]
          );
          let width = /** @type {number} */ (instruction[13]);
          const declutterImageWithText =
            /** @type {import("../canvas.js").DeclutterImageWithText} */ (
              instruction[14]
            );

          if (!image && instruction.length >= 19) {
            // create label images
            text = /** @type {string} */ (instruction[18]);
            textKey = /** @type {string} */ (instruction[19]);
            strokeKey = /** @type {string} */ (instruction[20]);
            fillKey = /** @type {string} */ (instruction[21]);
            const labelWithAnchor = this.drawLabelWithPointPlacement_(
              text,
              textKey,
              strokeKey,
              fillKey
            );
            image = labelWithAnchor.label;
            instruction[3] = image;
            const textOffsetX = /** @type {number} */ (instruction[22]);
            anchorX = (labelWithAnchor.anchorX - textOffsetX) * this.pixelRatio;
            instruction[4] = anchorX;
            const textOffsetY = /** @type {number} */ (instruction[23]);
            anchorY = (labelWithAnchor.anchorY - textOffsetY) * this.pixelRatio;
            instruction[5] = anchorY;
            height = image.height;
            instruction[6] = height;
            width = image.width;
            instruction[13] = width;
          }

          let geometryWidths;
          if (instruction.length > 24) {
            geometryWidths = /** @type {number} */ (instruction[24]);
          }

          let padding, backgroundFill, backgroundStroke;
          if (instruction.length > 16) {
            padding = /** @type {Array<number>} */ (instruction[15]);
            backgroundFill = /** @type {boolean} */ (instruction[16]);
            backgroundStroke = /** @type {boolean} */ (instruction[17]);
          } else {
            padding = defaultPadding;
            backgroundFill = false;
            backgroundStroke = false;
          }

          if (rotateWithView && viewRotationFromTransform) {
            // Canvas is expected to be rotated to reverse view rotation.
            rotation += viewRotation;
          } else if (!rotateWithView && !viewRotationFromTransform) {
            // Canvas is not rotated, images need to be rotated back to be north-up.
            rotation -= viewRotation;
          }
          let widthIndex = 0;
          for (; d < dd; d += 2) {
            if (
              geometryWidths &&
              geometryWidths[widthIndex++] < width / this.pixelRatio
            ) {
              continue;
            }
            const dimensions = this.calculateImageOrLabelDimensions_(
              image.width,
              image.height,
              pixelCoordinates[d],
              pixelCoordinates[d + 1],
              width,
              height,
              anchorX,
              anchorY,
              originX,
              originY,
              rotation,
              scale,
              snapToPixel,
              padding,
              backgroundFill || backgroundStroke,
              feature
            );
            /** @type {ReplayImageOrLabelArgs} */
            const args = [
              context,
              contextScale,
              image,
              dimensions,
              opacity,
              backgroundFill
                ? /** @type {Array<*>} */ (lastFillInstruction)
                : null,
              backgroundStroke
                ? /** @type {Array<*>} */ (lastStrokeInstruction)
                : null,
            ];
            let imageArgs;
            let imageDeclutterBox;
            if (opt_declutterTree && declutterImageWithText) {
              const index = dd - d;
              if (!declutterImageWithText[index]) {
                // We now have the image for an image+text combination.
                declutterImageWithText[index] = args;
                // Don't render anything for now, wait for the text.
                continue;
              }
              imageArgs = declutterImageWithText[index];
              delete declutterImageWithText[index];
              imageDeclutterBox = getDeclutterBox(imageArgs);
              if (opt_declutterTree.collides(imageDeclutterBox)) {
                continue;
              }
            }
            if (
              opt_declutterTree &&
              opt_declutterTree.collides(dimensions.declutterBox)
            ) {
              continue;
            }
            if (imageArgs) {
              // We now have image and text for an image+text combination.
              if (opt_declutterTree) {
                opt_declutterTree.insert(imageDeclutterBox);
              }
              // Render the image before we render the text.
              this.replayImageOrLabel_.apply(this, imageArgs);
            }
            if (opt_declutterTree) {
              opt_declutterTree.insert(dimensions.declutterBox);
            }
            this.replayImageOrLabel_.apply(this, args);
          }
          ++i;
          break;
        case CanvasInstruction.DRAW_CHARS:
          const begin = /** @type {number} */ (instruction[1]);
          const end = /** @type {number} */ (instruction[2]);
          const baseline = /** @type {number} */ (instruction[3]);
          const overflow = /** @type {number} */ (instruction[4]);
          fillKey = /** @type {string} */ (instruction[5]);
          const maxAngle = /** @type {number} */ (instruction[6]);
          const measurePixelRatio = /** @type {number} */ (instruction[7]);
          const offsetY = /** @type {number} */ (instruction[8]);
          strokeKey = /** @type {string} */ (instruction[9]);
          const strokeWidth = /** @type {number} */ (instruction[10]);
          text = /** @type {string} */ (instruction[11]);
          textKey = /** @type {string} */ (instruction[12]);
          const pixelRatioScale = [
            /** @type {number} */ (instruction[13]),
            /** @type {number} */ (instruction[13]),
          ];

          const textState = this.textStates[textKey];
          const font = textState.font;
          const textScale = [
            textState.scale[0] * measurePixelRatio,
            textState.scale[1] * measurePixelRatio,
          ];

          let cachedWidths;
          if (font in this.widths_) {
            cachedWidths = this.widths_[font];
          } else {
            cachedWidths = {};
            this.widths_[font] = cachedWidths;
          }

          const pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
          const textLength =
            Math.abs(textScale[0]) *
            measureAndCacheTextWidth(font, text, cachedWidths);
          if (overflow || textLength <= pathLength) {
            const textAlign = this.textStates[textKey].textAlign;
            const startM = (pathLength - textLength) * TEXT_ALIGN[textAlign];
            const parts = drawTextOnPath(
              pixelCoordinates,
              begin,
              end,
              2,
              text,
              startM,
              maxAngle,
              Math.abs(textScale[0]),
              measureAndCacheTextWidth,
              font,
              cachedWidths,
              viewRotationFromTransform ? 0 : this.viewRotation_
            );
            drawChars: if (parts) {
              /** @type {Array<ReplayImageOrLabelArgs>} */
              const replayImageOrLabelArgs = [];
              let c, cc, chars, label, part;
              if (strokeKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = this.createLabel(chars, textKey, '', strokeKey);
                  anchorX =
                    /** @type {number} */ (part[2]) +
                    (textScale[0] < 0 ? -strokeWidth : strokeWidth);
                  anchorY =
                    baseline * label.height +
                    ((0.5 - baseline) * 2 * strokeWidth * textScale[1]) /
                      textScale[0] -
                    offsetY;
                  const dimensions = this.calculateImageOrLabelDimensions_(
                    label.width,
                    label.height,
                    part[0],
                    part[1],
                    label.width,
                    label.height,
                    anchorX,
                    anchorY,
                    0,
                    0,
                    part[3],
                    pixelRatioScale,
                    false,
                    defaultPadding,
                    false,
                    feature
                  );
                  if (
                    opt_declutterTree &&
                    opt_declutterTree.collides(dimensions.declutterBox)
                  ) {
                    break drawChars;
                  }
                  replayImageOrLabelArgs.push([
                    context,
                    contextScale,
                    label,
                    dimensions,
                    1,
                    null,
                    null,
                  ]);
                }
              }
              if (fillKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = this.createLabel(chars, textKey, fillKey, '');
                  anchorX = /** @type {number} */ (part[2]);
                  anchorY = baseline * label.height - offsetY;
                  const dimensions = this.calculateImageOrLabelDimensions_(
                    label.width,
                    label.height,
                    part[0],
                    part[1],
                    label.width,
                    label.height,
                    anchorX,
                    anchorY,
                    0,
                    0,
                    part[3],
                    pixelRatioScale,
                    false,
                    defaultPadding,
                    false,
                    feature
                  );
                  if (
                    opt_declutterTree &&
                    opt_declutterTree.collides(dimensions.declutterBox)
                  ) {
                    break drawChars;
                  }
                  replayImageOrLabelArgs.push([
                    context,
                    contextScale,
                    label,
                    dimensions,
                    1,
                    null,
                    null,
                  ]);
                }
              }
              if (opt_declutterTree) {
                opt_declutterTree.load(
                  replayImageOrLabelArgs.map(getDeclutterBox)
                );
              }
              for (let i = 0, ii = replayImageOrLabelArgs.length; i < ii; ++i) {
                this.replayImageOrLabel_.apply(this, replayImageOrLabelArgs[i]);
              }
            }
          }
          ++i;
          break;
        case CanvasInstruction.END_GEOMETRY:
          if (opt_featureCallback !== undefined) {
            feature = /** @type {import("../../Feature.js").FeatureLike} */ (
              instruction[1]
            );
            const result = opt_featureCallback(feature, currentGeometry);
            if (result) {
              return result;
            }
          }
          ++i;
          break;
        case CanvasInstruction.FILL:
          if (batchSize) {
            pendingFill++;
          } else {
            this.fill_(context);
          }
          ++i;
          break;
        case CanvasInstruction.MOVE_TO_LINE_TO:
          d = /** @type {number} */ (instruction[1]);
          dd = /** @type {number} */ (instruction[2]);
          x = pixelCoordinates[d];
          y = pixelCoordinates[d + 1];
          roundX = (x + 0.5) | 0;
          roundY = (y + 0.5) | 0;
          if (roundX !== prevX || roundY !== prevY) {
            context.moveTo(x, y);
            prevX = roundX;
            prevY = roundY;
          }
          for (d += 2; d < dd; d += 2) {
            x = pixelCoordinates[d];
            y = pixelCoordinates[d + 1];
            roundX = (x + 0.5) | 0;
            roundY = (y + 0.5) | 0;
            if (d == dd - 2 || roundX !== prevX || roundY !== prevY) {
              context.lineTo(x, y);
              prevX = roundX;
              prevY = roundY;
            }
          }
          ++i;
          break;
        case CanvasInstruction.SET_FILL_STYLE:
          lastFillInstruction = instruction;
          this.alignFill_ = instruction[2];

          if (pendingFill) {
            this.fill_(context);
            pendingFill = 0;
            if (pendingStroke) {
              context.stroke();
              pendingStroke = 0;
            }
          }

          context.fillStyle =
            /** @type {import("../../colorlike.js").ColorLike} */ (
              instruction[1]
            );
          ++i;
          break;
        case CanvasInstruction.SET_STROKE_STYLE:
          lastStrokeInstruction = instruction;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
          this.setStrokeStyle_(context, /** @type {Array<*>} */ (instruction));
          ++i;
          break;
        case CanvasInstruction.STROKE:
          if (batchSize) {
            pendingStroke++;
          } else {
            context.stroke();
          }
          ++i;
          break;
        default:
          ++i; // consume the instruction anyway, to avoid an infinite loop
          break;
      }
    }
    if (pendingFill) {
      this.fill_(context);
    }
    if (pendingStroke) {
      context.stroke();
    }
    return undefined;
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {number} contextScale Scale of the context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
   * @param {import("rbush").default} [opt_declutterTree] Declutter tree.
   */
  execute(
    context,
    contextScale,
    transform,
    viewRotation,
    snapToPixel,
    opt_declutterTree
  ) {
    this.viewRotation_ = viewRotation;
    this.execute_(
      context,
      contextScale,
      transform,
      this.instructions,
      snapToPixel,
      undefined,
      undefined,
      opt_declutterTree
    );
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {FeatureCallback<T>} [opt_featureCallback] Feature callback.
   * @param {import("../../extent.js").Extent} [opt_hitExtent] Only check
   *     features that intersect this extent.
   * @return {T|undefined} Callback result.
   * @template T
   */
  executeHitDetection(
    context,
    transform,
    viewRotation,
    opt_featureCallback,
    opt_hitExtent
  ) {
    this.viewRotation_ = viewRotation;
    return this.execute_(
      context,
      1,
      transform,
      this.hitDetectionInstructions,
      true,
      opt_featureCallback,
      opt_hitExtent
    );
  }
}

export default Executor;
