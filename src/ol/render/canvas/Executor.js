/**
 * @module ol/render/canvas/Executor
 */
import {getUid} from '../../util.js';
import {equals} from '../../array.js';
import {createEmpty, createOrUpdate,
  createOrUpdateEmpty, extend, intersects} from '../../extent.js';
import {lineStringLength} from '../../geom/flat/length.js';
import {drawTextOnPath} from '../../geom/flat/textpath.js';
import {transform2D} from '../../geom/flat/transform.js';
import {isEmpty} from '../../obj.js';
import {drawImage, defaultPadding, defaultTextBaseline} from '../canvas.js';
import CanvasInstruction from './Instruction.js';
import {TEXT_ALIGN} from './TextBuilder.js';
import {
  create as createTransform,
  compose as composeTransform,
  apply as applyTransform,
  setFromArray as transformSetFromArray
} from '../../transform.js';
import {createCanvasContext2D} from '../../dom.js';
import {labelCache, defaultTextAlign, measureTextHeight, measureAndCacheTextWidth, measureTextWidths} from '../canvas.js';
import Disposable from '../../Disposable.js';


/**
 * @typedef {Object} SerializableInstructions
 * @property {Array<*>} instructions The rendering instructions.
 * @property {Array<*>} hitDetectionInstructions The rendering hit detection instructions.
 * @property {Array<number>} coordinates The array of all coordinates.
 * @property {!Object<string, import("../canvas.js").TextState>} textStates The text states (decluttering).
 * @property {!Object<string, import("../canvas.js").FillState>} fillStates The fill states (decluttering).
 * @property {!Object<string, import("../canvas.js").StrokeState>} strokeStates The stroke states (decluttering).
 */

/**
 * @type {import("../../extent.js").Extent}
 */
const tmpExtent = createEmpty();

/**
 * @type {!import("../../transform.js").Transform}
 */
const tmpTransform = createTransform();

/** @type {import("../../coordinate.js").Coordinate} */
const p1 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p2 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p3 = [];
/** @type {import("../../coordinate.js").Coordinate} */
const p4 = [];


class Executor extends Disposable {
  /**
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {boolean} overlaps The replay can have overlapping geometries.
   * @param {?} declutterTree Declutter tree.
   * @param {SerializableInstructions} instructions The serializable instructions
   */
  constructor(resolution, pixelRatio, overlaps, declutterTree, instructions) {
    super();
    /**
     * @type {?}
     */
    this.declutterTree = declutterTree;

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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    labelCache.release(this);
    super.disposeInternal();
  }


  /**
   * @param {string} text Text.
   * @param {string} textKey Text style key.
   * @param {string} fillKey Fill style key.
   * @param {string} strokeKey Stroke style key.
   * @return {HTMLCanvasElement} Image.
   */
  getTextImage(text, textKey, fillKey, strokeKey) {
    let label;
    const key = strokeKey + textKey + text + fillKey + this.pixelRatio;

    if (!labelCache.containsKey(key)) {
      const strokeState = strokeKey ? this.strokeStates[strokeKey] : null;
      const fillState = fillKey ? this.fillStates[fillKey] : null;
      const textState = this.textStates[textKey];
      const pixelRatio = this.pixelRatio;
      const scale = textState.scale * pixelRatio;
      const align = TEXT_ALIGN[textState.textAlign || defaultTextAlign];
      const strokeWidth = strokeKey && strokeState.lineWidth ? strokeState.lineWidth : 0;

      const lines = text.split('\n');
      const numLines = lines.length;
      const widths = [];
      const width = measureTextWidths(textState.font, lines, widths);
      const lineHeight = measureTextHeight(textState.font);
      const height = lineHeight * numLines;
      const renderWidth = (width + strokeWidth);
      const context = createCanvasContext2D(
        Math.ceil(renderWidth * scale),
        Math.ceil((height + strokeWidth) * scale));
      label = context.canvas;
      labelCache.set(key, label);
      if (scale != 1) {
        context.scale(scale, scale);
      }
      context.font = textState.font;
      if (strokeKey) {
        context.strokeStyle = strokeState.strokeStyle;
        context.lineWidth = strokeWidth;
        context.lineCap = /** @type {CanvasLineCap} */ (strokeState.lineCap);
        context.lineJoin = /** @type {CanvasLineJoin} */ (strokeState.lineJoin);
        context.miterLimit = strokeState.miterLimit;
        if (context.setLineDash && strokeState.lineDash.length) {
          context.setLineDash(strokeState.lineDash);
          context.lineDashOffset = strokeState.lineDashOffset;
        }
      }
      if (fillKey) {
        context.fillStyle = fillState.fillStyle;
      }
      context.textBaseline = 'middle';
      context.textAlign = 'center';
      const leftRight = (0.5 - align);
      const x = align * label.width / scale + leftRight * strokeWidth;
      let i;
      if (strokeKey) {
        for (i = 0; i < numLines; ++i) {
          context.strokeText(lines[i], x + leftRight * widths[i], 0.5 * (strokeWidth + lineHeight) + i * lineHeight);
        }
      }
      if (fillKey) {
        for (i = 0; i < numLines; ++i) {
          context.fillText(lines[i], x + leftRight * widths[i], 0.5 * (strokeWidth + lineHeight) + i * lineHeight);
        }
      }
    }
    return labelCache.get(key, this);
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
  replayTextBackground_(context, p1, p2, p3, p4, fillInstruction, strokeInstruction) {
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
      this.setStrokeStyle_(context, /** @type {Array<*>} */ (strokeInstruction));
      context.stroke();
    }
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image Image.
   * @param {number} anchorX Anchor X.
   * @param {number} anchorY Anchor Y.
   * @param {import("../canvas.js").DeclutterGroup} declutterGroup Declutter group.
   * @param {number} height Height.
   * @param {number} opacity Opacity.
   * @param {number} originX Origin X.
   * @param {number} originY Origin Y.
   * @param {number} rotation Rotation.
   * @param {number} scale Scale.
   * @param {boolean} snapToPixel Snap to pixel.
   * @param {number} width Width.
   * @param {Array<number>} padding Padding.
   * @param {Array<*>} fillInstruction Fill instruction.
   * @param {Array<*>} strokeInstruction Stroke instruction.
   */
  replayImage_(
    context,
    x,
    y,
    image,
    anchorX,
    anchorY,
    declutterGroup,
    height,
    opacity,
    originX,
    originY,
    rotation,
    scale,
    snapToPixel,
    width,
    padding,
    fillInstruction,
    strokeInstruction
  ) {
    const fillStroke = fillInstruction || strokeInstruction;
    anchorX *= scale;
    anchorY *= scale;
    x -= anchorX;
    y -= anchorY;

    const w = (width + originX > image.width) ? image.width - originX : width;
    const h = (height + originY > image.height) ? image.height - originY : height;
    const boxW = padding[3] + w * scale + padding[1];
    const boxH = padding[0] + h * scale + padding[2];
    const boxX = x - padding[3];
    const boxY = y - padding[0];

    if (fillStroke || rotation !== 0) {
      p1[0] = p4[0] = boxX;
      p1[1] = p2[1] = boxY;
      p2[0] = p3[0] = boxX + boxW;
      p3[1] = p4[1] = boxY + boxH;
    }

    let transform = null;
    if (rotation !== 0) {
      const centerX = x + anchorX;
      const centerY = y + anchorY;
      transform = composeTransform(tmpTransform, centerX, centerY, 1, 1, rotation, -centerX, -centerY);

      applyTransform(tmpTransform, p1);
      applyTransform(tmpTransform, p2);
      applyTransform(tmpTransform, p3);
      applyTransform(tmpTransform, p4);
      createOrUpdate(
        Math.min(p1[0], p2[0], p3[0], p4[0]),
        Math.min(p1[1], p2[1], p3[1], p4[1]),
        Math.max(p1[0], p2[0], p3[0], p4[0]),
        Math.max(p1[1], p2[1], p3[1], p4[1]),
        tmpExtent
      );
    } else {
      createOrUpdate(boxX, boxY, boxX + boxW, boxY + boxH, tmpExtent);
    }
    const canvas = context.canvas;
    const strokePadding = strokeInstruction ? (strokeInstruction[2] * scale / 2) : 0;
    const intersects =
        tmpExtent[0] - strokePadding <= canvas.width && tmpExtent[2] + strokePadding >= 0 &&
        tmpExtent[1] - strokePadding <= canvas.height && tmpExtent[3] + strokePadding >= 0;

    if (snapToPixel) {
      x = Math.round(x);
      y = Math.round(y);
    }

    if (declutterGroup) {
      if (!intersects && declutterGroup[4] == 1) {
        return;
      }
      extend(declutterGroup, tmpExtent);
      const declutterArgs = intersects ?
        [context, transform ? transform.slice(0) : null, opacity, image, originX, originY, w, h, x, y, scale] :
        null;
      if (declutterArgs && fillStroke) {
        declutterArgs.push(fillInstruction, strokeInstruction, p1, p2, p3, p4);
      }
      declutterGroup.push(declutterArgs);
    } else if (intersects) {
      if (fillStroke) {
        this.replayTextBackground_(context, p1, p2, p3, p4,
          /** @type {Array<*>} */ (fillInstruction),
          /** @type {Array<*>} */ (strokeInstruction));
      }
      drawImage(context, transform, opacity, image, originX, originY, w, h, x, y, scale);
    }
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
    context.strokeStyle = /** @type {import("../../colorlike.js").ColorLike} */ (instruction[1]);
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
   * @param {import("../canvas.js").DeclutterGroup} declutterGroup Declutter group.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   */
  renderDeclutter_(declutterGroup, feature) {
    if (declutterGroup && declutterGroup.length > 5) {
      const groupCount = declutterGroup[4];
      if (groupCount == 1 || groupCount == declutterGroup.length - 5) {
        /** @type {import("../../structs/RBush.js").Entry} */
        const box = {
          minX: /** @type {number} */ (declutterGroup[0]),
          minY: /** @type {number} */ (declutterGroup[1]),
          maxX: /** @type {number} */ (declutterGroup[2]),
          maxY: /** @type {number} */ (declutterGroup[3]),
          value: feature
        };
        if (!this.declutterTree.collides(box)) {
          this.declutterTree.insert(box);
          for (let j = 5, jj = declutterGroup.length; j < jj; ++j) {
            const declutterData = /** @type {Array} */ (declutterGroup[j]);
            if (declutterData) {
              if (declutterData.length > 11) {
                this.replayTextBackground_(declutterData[0],
                  declutterData[13], declutterData[14], declutterData[15], declutterData[16],
                  declutterData[11], declutterData[12]);
              }
              drawImage.apply(undefined, declutterData);
            }
          }
        }
        declutterGroup.length = 5;
        createOrUpdateEmpty(declutterGroup);
      }
    }
  }

  /**
   * @private
   * @param {string} text The text to draw.
   * @param {string} textKey The key of the text state.
   * @param {string} strokeKey The key for the stroke state.
   * @param {string} fillKey The key for the fill state.
   * @return {{label: HTMLCanvasElement, anchorX: number, anchorY: number}} The text image and its anchor.
   */
  drawTextImageWithPointPlacement_(text, textKey, strokeKey, fillKey) {
    const textState = this.textStates[textKey];

    const label = this.getTextImage(text, textKey, fillKey, strokeKey);

    const strokeState = this.strokeStates[strokeKey];
    const pixelRatio = this.pixelRatio;
    const align = TEXT_ALIGN[textState.textAlign || defaultTextAlign];
    const baseline = TEXT_ALIGN[textState.textBaseline || defaultTextBaseline];
    const strokeWidth = strokeState && strokeState.lineWidth ? strokeState.lineWidth : 0;

    const anchorX = align * label.width / pixelRatio + 2 * (0.5 - align) * strokeWidth;
    const anchorY = baseline * label.height / pixelRatio + 2 * (0.5 - baseline) * strokeWidth;

    return {
      label: label,
      anchorX: anchorX,
      anchorY: anchorY
    };
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features
   *     to skip.
   * @param {Array<*>} instructions Instructions array.
   * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
   * @param {function(import("../../Feature.js").FeatureLike): T|undefined} featureCallback Feature callback.
   * @param {import("../../extent.js").Extent=} opt_hitExtent Only check features that intersect this
   *     extent.
   * @return {T|undefined} Callback result.
   * @template T
   */
  execute_(
    context,
    transform,
    skippedFeaturesHash,
    instructions,
    snapToPixel,
    featureCallback,
    opt_hitExtent
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
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
      transformSetFromArray(this.renderedTransform_, transform);
    }
    const skipFeatures = !isEmpty(skippedFeaturesHash);
    let i = 0; // instruction index
    const ii = instructions.length; // end of instructions
    let d = 0; // data index
    let dd; // end of per-instruction data
    let anchorX, anchorY, prevX, prevY, roundX, roundY, declutterGroup, image, text, textKey;
    let strokeKey, fillKey;
    let pendingFill = 0;
    let pendingStroke = 0;
    let lastFillInstruction = null;
    let lastStrokeInstruction = null;
    const coordinateCache = this.coordinateCache_;
    const viewRotation = this.viewRotation_;

    const state = /** @type {import("../../render.js").State} */ ({
      context: context,
      pixelRatio: this.pixelRatio,
      resolution: this.resolution,
      rotation: viewRotation
    });

    // When the batch size gets too big, performance decreases. 200 is a good
    // balance between batch size and number of fill/stroke instructions.
    const batchSize = this.instructions != instructions || this.overlaps ? 0 : 200;
    let /** @type {import("../../Feature.js").FeatureLike} */ feature;
    let x, y;
    while (i < ii) {
      const instruction = instructions[i];
      const type = /** @type {CanvasInstruction} */ (instruction[0]);
      switch (type) {
        case CanvasInstruction.BEGIN_GEOMETRY:
          feature = /** @type {import("../../Feature.js").FeatureLike} */ (instruction[1]);
          if ((skipFeatures && skippedFeaturesHash[getUid(feature)]) || !feature.getGeometry()) {
            i = /** @type {number} */ (instruction[2]);
          } else if (opt_hitExtent !== undefined && !intersects(
            opt_hitExtent, feature.getGeometry().getExtent())) {
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
            prevX = prevY = NaN;
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
          const geometry = /** @type {import("../../geom/SimpleGeometry.js").default} */ (instruction[3]);
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
          image = /** @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} */ (instruction[3]);

          // Remaining arguments in DRAW_IMAGE are in alphabetical order
          anchorX = /** @type {number} */ (instruction[4]);
          anchorY = /** @type {number} */ (instruction[5]);
          declutterGroup = featureCallback ? null : /** @type {import("../canvas.js").DeclutterGroup} */ (instruction[6]);
          let height = /** @type {number} */ (instruction[7]);
          const opacity = /** @type {number} */ (instruction[8]);
          const originX = /** @type {number} */ (instruction[9]);
          const originY = /** @type {number} */ (instruction[10]);
          const rotateWithView = /** @type {boolean} */ (instruction[11]);
          let rotation = /** @type {number} */ (instruction[12]);
          const scale = /** @type {number} */ (instruction[13]);
          let width = /** @type {number} */ (instruction[14]);


          if (!image && instruction.length >= 19) {
            // create label images
            text = /** @type {string} */ (instruction[18]);
            textKey = /** @type {string} */ (instruction[19]);
            strokeKey = /** @type {string} */ (instruction[20]);
            fillKey = /** @type {string} */ (instruction[21]);
            const labelWithAnchor = this.drawTextImageWithPointPlacement_(text, textKey, strokeKey, fillKey);
            image = instruction[3] = labelWithAnchor.label;
            const textOffsetX = /** @type {number} */ (instruction[22]);
            anchorX = instruction[4] = (labelWithAnchor.anchorX - textOffsetX) * this.pixelRatio;
            const textOffsetY = /** @type {number} */ (instruction[23]);
            anchorY = instruction[5] = (labelWithAnchor.anchorY - textOffsetY) * this.pixelRatio;
            height = instruction[7] = image.height;
            width = instruction[14] = image.width;
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
            backgroundFill = backgroundStroke = false;
          }

          if (rotateWithView) {
            rotation += viewRotation;
          }
          let widthIndex = 0;
          for (; d < dd; d += 2) {
            if (geometryWidths && geometryWidths[widthIndex++] < width / this.pixelRatio) {
              continue;
            }
            this.replayImage_(context,
              pixelCoordinates[d], pixelCoordinates[d + 1], image, anchorX, anchorY,
              declutterGroup, height, opacity, originX, originY, rotation, scale,
              snapToPixel, width, padding,
              backgroundFill ? /** @type {Array<*>} */ (lastFillInstruction) : null,
              backgroundStroke ? /** @type {Array<*>} */ (lastStrokeInstruction) : null);
          }
          this.renderDeclutter_(declutterGroup, feature);
          ++i;
          break;
        case CanvasInstruction.DRAW_CHARS:
          const begin = /** @type {number} */ (instruction[1]);
          const end = /** @type {number} */ (instruction[2]);
          const baseline = /** @type {number} */ (instruction[3]);
          declutterGroup = featureCallback ? null : /** @type {import("../canvas.js").DeclutterGroup} */ (instruction[4]);
          const overflow = /** @type {number} */ (instruction[5]);
          fillKey = /** @type {string} */ (instruction[6]);
          const maxAngle = /** @type {number} */ (instruction[7]);
          const measurePixelRatio = /** @type {number} */ (instruction[8]);
          const offsetY = /** @type {number} */ (instruction[9]);
          strokeKey = /** @type {string} */ (instruction[10]);
          const strokeWidth = /** @type {number} */ (instruction[11]);
          text = /** @type {string} */ (instruction[12]);
          textKey = /** @type {string} */ (instruction[13]);
          const pixelRatioScale = /** @type {number} */ (instruction[14]);

          const textState = this.textStates[textKey];
          const font = textState.font;
          const textScale = textState.scale * measurePixelRatio;

          let cachedWidths;
          if (font in this.widths_) {
            cachedWidths = this.widths_[font];
          } else {
            cachedWidths = this.widths_[font] = {};
          }

          const pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
          const textLength = textScale * measureAndCacheTextWidth(font, text, cachedWidths);
          if (overflow || textLength <= pathLength) {
            const textAlign = this.textStates[textKey].textAlign;
            const startM = (pathLength - textLength) * TEXT_ALIGN[textAlign];
            const parts = drawTextOnPath(
              pixelCoordinates, begin, end, 2, text, startM, maxAngle, textScale, measureAndCacheTextWidth, font, cachedWidths);
            if (parts) {
              let c, cc, chars, label, part;
              if (strokeKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = this.getTextImage(chars, textKey, '', strokeKey);
                  anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                  anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                  this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), pixelRatioScale, false, label.width,
                    defaultPadding, null, null);
                }
              }
              if (fillKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = this.getTextImage(chars, textKey, fillKey, '');
                  anchorX = /** @type {number} */ (part[2]);
                  anchorY = baseline * label.height - offsetY;
                  this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), pixelRatioScale, false, label.width,
                    defaultPadding, null, null);
                }
              }
            }
          }
          this.renderDeclutter_(declutterGroup, feature);
          ++i;
          break;
        case CanvasInstruction.END_GEOMETRY:
          if (featureCallback !== undefined) {
            feature = /** @type {import("../../Feature.js").FeatureLike} */ (instruction[1]);
            const result = featureCallback(feature);
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

          context.fillStyle = /** @type {import("../../colorlike.js").ColorLike} */ (instruction[1]);
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
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features
   *     to skip.
   * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
   */
  execute(context, transform, viewRotation, skippedFeaturesHash, snapToPixel) {
    this.viewRotation_ = viewRotation;
    this.execute_(context, transform,
      skippedFeaturesHash, this.instructions, snapToPixel, undefined, undefined);
  }

  /**
   * @param {CanvasRenderingContext2D} context Context.
   * @param {import("../../transform.js").Transform} transform Transform.
   * @param {number} viewRotation View rotation.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features
   *     to skip.
   * @param {function(import("../../Feature.js").FeatureLike): T=} opt_featureCallback
   *     Feature callback.
   * @param {import("../../extent.js").Extent=} opt_hitExtent Only check features that intersect this
   *     extent.
   * @return {T|undefined} Callback result.
   * @template T
   */
  executeHitDetection(
    context,
    transform,
    viewRotation,
    skippedFeaturesHash,
    opt_featureCallback,
    opt_hitExtent
  ) {
    this.viewRotation_ = viewRotation;
    return this.execute_(context, transform, skippedFeaturesHash,
      this.hitDetectionInstructions, true, opt_featureCallback, opt_hitExtent);
  }
}


export default Executor;
