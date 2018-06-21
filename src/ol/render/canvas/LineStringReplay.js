/**
 * @module ol/render/canvas/LineStringReplay
 */
import {inherits} from '../../util.js';
import CanvasInstruction, {strokeInstruction, beginPathInstruction} from '../canvas/Instruction.js';
import CanvasReplay from '../canvas/Replay.js';

/**
 * @constructor
 * @extends {module:ol/render/canvas/Replay}
 * @param {number} tolerance Tolerance.
 * @param {module:ol/extent~Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @param {?} declutterTree Declutter tree.
 * @struct
 */
const CanvasLineStringReplay = function(
  tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  CanvasReplay.call(this,
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};

inherits(CanvasLineStringReplay, CanvasReplay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
CanvasLineStringReplay.prototype.drawFlatCoordinates_ = function(flatCoordinates, offset, end, stride) {
  const myBegin = this.coordinates.length;
  const myEnd = this.appendFlatCoordinates(
    flatCoordinates, offset, end, stride, false, false);
  const moveToLineToInstruction = [CanvasInstruction.MOVE_TO_LINE_TO, myBegin, myEnd];
  this.instructions.push(moveToLineToInstruction);
  this.hitDetectionInstructions.push(moveToLineToInstruction);
  return end;
};


/**
 * @inheritDoc
 */
CanvasLineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  const state = this.state;
  const strokeStyle = state.strokeStyle;
  const lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(lineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    CanvasInstruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], beginPathInstruction);
  const flatCoordinates = lineStringGeometry.getFlatCoordinates();
  const stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push(strokeInstruction);
  this.endGeometry(lineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
CanvasLineStringReplay.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  const state = this.state;
  const strokeStyle = state.strokeStyle;
  const lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(multiLineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    CanvasInstruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], beginPathInstruction);
  const ends = multiLineStringGeometry.getEnds();
  const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  const stride = multiLineStringGeometry.getStride();
  let offset = 0;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.drawFlatCoordinates_(flatCoordinates, offset, ends[i], stride);
  }
  this.hitDetectionInstructions.push(strokeInstruction);
  this.endGeometry(multiLineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
CanvasLineStringReplay.prototype.finish = function() {
  const state = this.state;
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push(strokeInstruction);
  }
  this.reverseHitDetectionInstructions();
  this.state = null;
};


/**
 * @inheritDoc.
 */
CanvasLineStringReplay.prototype.applyStroke = function(state) {
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push(strokeInstruction);
    state.lastStroke = this.coordinates.length;
  }
  state.lastStroke = 0;
  CanvasReplay.prototype.applyStroke.call(this, state);
  this.instructions.push(beginPathInstruction);
};
export default CanvasLineStringReplay;
