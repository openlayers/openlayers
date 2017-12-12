/**
 * @module ol/render/canvas/LineStringReplay
 */
import {inherits} from '../../index.js';
import _ol_render_canvas_Instruction_ from '../canvas/Instruction.js';
import _ol_render_canvas_Replay_ from '../canvas/Replay.js';

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
var _ol_render_canvas_LineStringReplay_ = function(
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  _ol_render_canvas_Replay_.call(this,
      tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};

inherits(_ol_render_canvas_LineStringReplay_, _ol_render_canvas_Replay_);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
_ol_render_canvas_LineStringReplay_.prototype.drawFlatCoordinates_ = function(flatCoordinates, offset, end, stride) {
  var myBegin = this.coordinates.length;
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false, false);
  var moveToLineToInstruction =
      [_ol_render_canvas_Instruction_.MOVE_TO_LINE_TO, myBegin, myEnd];
  this.instructions.push(moveToLineToInstruction);
  this.hitDetectionInstructions.push(moveToLineToInstruction);
  return end;
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.drawLineString = function(lineStringGeometry, feature) {
  var state = this.state;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
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
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push([_ol_render_canvas_Instruction_.STROKE]);
  this.endGeometry(lineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  var state = this.state;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
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
  var ends = multiLineStringGeometry.getEnds();
  var flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  var stride = multiLineStringGeometry.getStride();
  var offset = 0;
  var i, ii;
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
  var state = this.state;
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
  _ol_render_canvas_Replay_.prototype.applyStroke.call(this, state);
  this.instructions.push([_ol_render_canvas_Instruction_.BEGIN_PATH]);
};
export default _ol_render_canvas_LineStringReplay_;
