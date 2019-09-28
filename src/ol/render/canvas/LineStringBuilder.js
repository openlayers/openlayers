/**
 * @module ol/render/canvas/LineStringBuilder
 */
import CanvasInstruction, {strokeInstruction, beginPathInstruction} from './Instruction.js';
import CanvasBuilder from './Builder.js';

class CanvasLineStringBuilder extends CanvasBuilder {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Maximum extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {object} cacheInstructions Shared hitDetectionInstructions cache, for the entire layer.
   */
  constructor(tolerance, maxExtent, resolution, pixelRatio, cacheInstructions) {
    super(tolerance, maxExtent, resolution, pixelRatio);

    /**
     * @private
     * @type {object}
     */
    this.cacheInstructions_ = cacheInstructions || {};
  }

  /**
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @private
   * @return {number} end.
   */
  drawFlatCoordinates_(flatCoordinates, offset, end, stride) {
    const myBegin = this.coordinates.length;
    const myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false, false);
    const moveToLineToInstruction = [CanvasInstruction.MOVE_TO_LINE_TO, myBegin, myEnd];
    this.instructions.push(moveToLineToInstruction);
    this.hitDetectionInstructions.push(moveToLineToInstruction);
    return end;
  }

  /**
   * @inheritDoc
   */
  drawLineString(lineStringGeometry, feature) {
    const state = this.state;
    const strokeStyle = state.strokeStyle;
    const lineWidth = state.lineWidth;
    if (strokeStyle === undefined || lineWidth === undefined) {
      return;
    }
    this.updateStrokeStyle(state, this.applyStroke);
    this.beginGeometry(lineStringGeometry, feature);

    let arr = [
      CanvasInstruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ];
    const keyHash = JSON.stringify(arr);
    if (keyHash in this.cacheInstructions_) {
      arr = this.cacheInstructions_[keyHash];
    } else {
      this.cacheInstructions_[keyHash] = arr;
    }
    this.hitDetectionInstructions.push(arr, beginPathInstruction);

    const flatCoordinates = lineStringGeometry.getFlatCoordinates();
    const stride = lineStringGeometry.getStride();
    this.drawFlatCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
    this.hitDetectionInstructions.push(strokeInstruction);
    this.endGeometry(feature);
  }

  /**
   * @inheritDoc
   */
  drawMultiLineString(multiLineStringGeometry, feature) {
    const state = this.state;
    const strokeStyle = state.strokeStyle;
    const lineWidth = state.lineWidth;
    if (strokeStyle === undefined || lineWidth === undefined) {
      return;
    }
    this.updateStrokeStyle(state, this.applyStroke);
    this.beginGeometry(multiLineStringGeometry, feature);

    let arr = [
      CanvasInstruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ];
    const keyHash = JSON.stringify(arr);
    if (keyHash in this.cacheInstructions_) {
      arr = this.cacheInstructions_[keyHash];
    } else {
      this.cacheInstructions_[keyHash] = arr;
    }
    this.hitDetectionInstructions.push(arr, beginPathInstruction);

    const ends = multiLineStringGeometry.getEnds();
    const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
    const stride = multiLineStringGeometry.getStride();
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      offset = this.drawFlatCoordinates_(flatCoordinates, offset, ends[i], stride);
    }
    this.hitDetectionInstructions.push(strokeInstruction);
    this.endGeometry(feature);
  }

  /**
   * @inheritDoc
   */
  finish() {
    const state = this.state;
    if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
      this.instructions.push(strokeInstruction);
    }
    this.reverseHitDetectionInstructions();
    this.state = null;
    return super.finish();
  }

  /**
   * @inheritDoc.
   */
  applyStroke(state) {
    if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
      this.instructions.push(strokeInstruction);
      state.lastStroke = this.coordinates.length;
    }
    state.lastStroke = 0;
    super.applyStroke(state);
    this.instructions.push(beginPathInstruction);
  }
}


export default CanvasLineStringBuilder;
