goog.provide('ol.render.canvas.LineStringReplay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.colorlike');
goog.require('ol.extent');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.render.canvas.Replay');


/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
ol.render.canvas.LineStringReplay = function(tolerance, maxExtent, resolution, overlaps) {

  ol.render.canvas.Replay.call(this, tolerance, maxExtent, resolution, overlaps);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.bufferedMaxExtent_ = null;

  /**
   * @private
   * @type {{currentStrokeStyle: (ol.ColorLike|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineDash: Array.<number>,
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         lastStroke: number,
   *         strokeStyle: (ol.ColorLike|undefined),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined)}|null}
   */
  this.state_ = {
    currentStrokeStyle: undefined,
    currentLineCap: undefined,
    currentLineDash: null,
    currentLineJoin: undefined,
    currentLineWidth: undefined,
    currentMiterLimit: undefined,
    lastStroke: 0,
    strokeStyle: undefined,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined
  };

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
ol.render.canvas.LineStringReplay.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = ol.extent.clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      ol.extent.buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};


/**
 * @private
 */
ol.render.canvas.LineStringReplay.prototype.setStrokeStyle_ = function() {
  var state = this.state_;
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  ol.DEBUG && console.assert(strokeStyle !== undefined,
      'strokeStyle should be defined');
  ol.DEBUG && console.assert(lineCap !== undefined, 'lineCap should be defined');
  ol.DEBUG && console.assert(lineDash, 'lineDash should not be null');
  ol.DEBUG && console.assert(lineJoin !== undefined, 'lineJoin should be defined');
  ol.DEBUG && console.assert(lineWidth !== undefined, 'lineWidth should be defined');
  ol.DEBUG && console.assert(miterLimit !== undefined, 'miterLimit should be defined');
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      !ol.array.equals(state.currentLineDash, lineDash) ||
      state.currentLineJoin != lineJoin ||
      state.currentLineWidth != lineWidth ||
      state.currentMiterLimit != miterLimit) {
    if (state.lastStroke != this.coordinates.length) {
      this.instructions.push([ol.render.canvas.Instruction.STROKE]);
      state.lastStroke = this.coordinates.length;
    }
    this.instructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
      strokeStyle, lineWidth, lineCap, lineJoin, miterLimit, lineDash, true, 1
    ], [
      ol.render.canvas.Instruction.BEGIN_PATH
    ]);
    state.currentStrokeStyle = strokeStyle;
    state.currentLineCap = lineCap;
    state.currentLineDash = lineDash;
    state.currentLineJoin = lineJoin;
    state.currentLineWidth = lineWidth;
    state.currentMiterLimit = miterLimit;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  var state = this.state_;
  ol.DEBUG && console.assert(state, 'state should not be null');
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
  this.beginGeometry(lineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, true, 1
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
  var state = this.state_;
  ol.DEBUG && console.assert(state, 'state should not be null');
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
  this.beginGeometry(multiLineStringGeometry, feature);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
    state.miterLimit, state.lineDash, true, 1
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
  var state = this.state_;
  ol.DEBUG && console.assert(state, 'state should not be null');
  if (state.lastStroke != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  this.reverseHitDetectionInstructions();
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  ol.DEBUG && console.assert(this.state_, 'this.state_ should not be null');
  ol.DEBUG && console.assert(!fillStyle, 'fillStyle should be null');
  ol.DEBUG && console.assert(strokeStyle, 'strokeStyle should not be null');
  var strokeStyleColor = strokeStyle.getColor();
  this.state_.strokeStyle = ol.colorlike.asColorLike(strokeStyleColor ?
      strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.canvas.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.canvas.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
  var strokeStyleWidth = strokeStyle.getWidth();
  this.state_.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.canvas.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  this.state_.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;

  if (this.state_.lineWidth > this.maxLineWidth) {
    this.maxLineWidth = this.state_.lineWidth;
    // invalidate the buffered max extent cache
    this.bufferedMaxExtent_ = null;
  }
};
