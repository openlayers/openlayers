/**
 * @module ol/render/canvas/LineStringReplay
 */
import {inherits} from '../../index.js';
import _ol_render_canvas_Instruction_ from '../canvas/Instruction.js';
import CanvasReplay from '../canvas/Replay.js';

/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @param {?} declutterTree Declutter tree.
 * @struct
 */
const _ol_render_canvas_LineStringReplay_ = function(
  tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  CanvasReplay.call(this,
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};

inherits(_ol_render_canvas_LineStringReplay_, CanvasReplay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
_ol_render_canvas_LineStringReplay_.prototype.drawFlatCoordinates_ = function(flatCoordinates, offset, end, stride) {
  const myBegin = this.coordinates.length;
  const myEnd = this.appendFlatCoordinates(
    flatCoordinates, offset, end, stride, false, false);
  const moveToLineToInstruction =
      [_ol_render_canvas_Instruction_.MOVE_TO_LINE_TO, myBegin, myEnd];
  this.instructions.push(moveToLineToInstruction);
  this.hitDetectionInstructions.push(moveToLineToInstruction);
  return end;
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.drawLineString = function(lineStringGeometry, feature) {
  const state = this.state;
  const strokeStyle = state.strokeStyle;
  const lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(lineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], [
    _ol_render_canvas_Instruction_.BEGIN_PATH
  ]);
  const flatCoordinates = lineStringGeometry.getFlatCoordinates();
  const stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push([_ol_render_canvas_Instruction_.STROKE]);
  this.endGeometry(lineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  const state = this.state;
  const strokeStyle = state.strokeStyle;
  const lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(multiLineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], [
    _ol_render_canvas_Instruction_.BEGIN_PATH
  ]);
  const ends = multiLineStringGeometry.getEnds();
  const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  const stride = multiLineStringGeometry.getStride();
  let offset = 0;
  let i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.drawFlatCoordinates_(
      flatCoordinates, offset, ends[i], stride);
  }
  this.hitDetectionInstructions.push([_ol_render_canvas_Instruction_.STROKE]);
  this.endGeometry(multiLineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.finish = function() {
  const state = this.state;
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push([_ol_render_canvas_Instruction_.STROKE]);
  }
  this.reverseHitDetectionInstructions();
  this.state = null;
};


/**
 * @inheritDoc.
 */
_ol_render_canvas_LineStringReplay_.prototype.applyStroke = function(state) {
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push([_ol_render_canvas_Instruction_.STROKE]);
    state.lastStroke = this.coordinates.length;
  }
  state.lastStroke = 0;
  CanvasReplay.prototype.applyStroke.call(this, state);
  this.instructions.push([_ol_render_canvas_Instruction_.BEGIN_PATH]);
};
export default _ol_render_canvas_LineStringReplay_;
