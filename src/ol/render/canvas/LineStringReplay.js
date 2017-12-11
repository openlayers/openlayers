goog.provide('ol.render.canvas.LineStringReplay');

goog.require('ol');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.render.canvas.Replay');


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
ol.render.canvas.LineStringReplay = function(
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  ol.render.canvas.Replay.call(this,
      tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};
ol.inherits(ol.render.canvas.LineStringReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
ol.render.canvas.LineStringReplay.prototype.drawFlatCoordinates_ = function(flatCoordinates, offset, end, stride) {
  var myBegin = this.coordinates.length;
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false, false);
  var moveToLineToInstruction =
      [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myBegin, myEnd];
  this.instructions.push(moveToLineToInstruction);
  this.hitDetectionInstructions.push(moveToLineToInstruction);
  return end;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  var state = this.state;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(lineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], [
    ol.render.canvas.Instruction.BEGIN_PATH
  ]);
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.STROKE]);
  this.endGeometry(lineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  var state = this.state;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.updateStrokeStyle(state, this.applyStroke);
  this.beginGeometry(multiLineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, state.lineDashOffset
  ], [
    ol.render.canvas.Instruction.BEGIN_PATH
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
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.STROKE]);
  this.endGeometry(multiLineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.finish = function() {
  var state = this.state;
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  this.reverseHitDetectionInstructions();
  this.state = null;
};


/**
 * @inheritDoc.
 */
ol.render.canvas.LineStringReplay.prototype.applyStroke = function(state) {
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
    state.lastStroke = this.coordinates.length;
  }
  state.lastStroke = 0;
  ol.render.canvas.Replay.prototype.applyStroke.call(this, state);
  this.instructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
};
