import _ol_ from '../../index';
import _ol_array_ from '../../array';
import _ol_colorlike_ from '../../colorlike';
import _ol_extent_ from '../../extent';
import _ol_render_canvas_ from '../canvas';
import _ol_render_canvas_Instruction_ from '../canvas/instruction';
import _ol_render_canvas_Replay_ from '../canvas/replay';

/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
var _ol_render_canvas_LineStringReplay_ = function(tolerance, maxExtent, resolution, pixelRatio, overlaps) {

  _ol_render_canvas_Replay_.call(this, tolerance, maxExtent, resolution, pixelRatio, overlaps);

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
   *         currentLineDashOffset: (number|undefined),
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         lastStroke: (number|undefined),
   *         strokeStyle: (ol.ColorLike|undefined),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineDashOffset: (number|undefined),
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined)}|null}
   */
  this.state_ = {
    currentStrokeStyle: undefined,
    currentLineCap: undefined,
    currentLineDash: null,
    currentLineDashOffset: undefined,
    currentLineJoin: undefined,
    currentLineWidth: undefined,
    currentMiterLimit: undefined,
    lastStroke: undefined,
    strokeStyle: undefined,
    lineCap: undefined,
    lineDash: null,
    lineDashOffset: undefined,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined
  };

};

_ol_.inherits(_ol_render_canvas_LineStringReplay_, _ol_render_canvas_Replay_);


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
_ol_render_canvas_LineStringReplay_.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = _ol_extent_.clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      _ol_extent_.buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};


/**
 * @private
 */
_ol_render_canvas_LineStringReplay_.prototype.setStrokeStyle_ = function() {
  var state = this.state_;
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineDashOffset = state.lineDashOffset;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      !_ol_array_.equals(state.currentLineDash, lineDash) ||
      state.currentLineDashOffset != lineDashOffset ||
      state.currentLineJoin != lineJoin ||
      state.currentLineWidth != lineWidth ||
      state.currentMiterLimit != miterLimit) {
    if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
      this.instructions.push([_ol_render_canvas_Instruction_.STROKE]);
      state.lastStroke = this.coordinates.length;
    }
    state.lastStroke = 0;
    this.instructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      strokeStyle, lineWidth * this.pixelRatio, lineCap, lineJoin, miterLimit,
      this.applyPixelRatio(lineDash), lineDashOffset * this.pixelRatio
    ], [
      _ol_render_canvas_Instruction_.BEGIN_PATH
    ]);
    state.currentStrokeStyle = strokeStyle;
    state.currentLineCap = lineCap;
    state.currentLineDash = lineDash;
    state.currentLineDashOffset = lineDashOffset;
    state.currentLineJoin = lineJoin;
    state.currentLineWidth = lineWidth;
    state.currentMiterLimit = miterLimit;
  }
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.drawLineString = function(lineStringGeometry, feature) {
  var state = this.state_;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
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
  var state = this.state_;
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
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
  var state = this.state_;
  if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
    this.instructions.push([_ol_render_canvas_Instruction_.STROKE]);
  }
  this.reverseHitDetectionInstructions();
  this.state_ = null;
};


/**
 * @inheritDoc
 */
_ol_render_canvas_LineStringReplay_.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  var strokeStyleColor = strokeStyle.getColor();
  this.state_.strokeStyle = _ol_colorlike_.asColorLike(strokeStyleColor ?
    strokeStyleColor : _ol_render_canvas_.defaultStrokeStyle);
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
    strokeStyleLineCap : _ol_render_canvas_.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
    strokeStyleLineDash : _ol_render_canvas_.defaultLineDash;
  var strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
  this.state_.lineDashOffset = strokeStyleLineDashOffset ?
    strokeStyleLineDashOffset : _ol_render_canvas_.defaultLineDashOffset;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
    strokeStyleLineJoin : _ol_render_canvas_.defaultLineJoin;
  var strokeStyleWidth = strokeStyle.getWidth();
  this.state_.lineWidth = strokeStyleWidth !== undefined ?
    strokeStyleWidth : _ol_render_canvas_.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  this.state_.miterLimit = strokeStyleMiterLimit !== undefined ?
    strokeStyleMiterLimit : _ol_render_canvas_.defaultMiterLimit;

  if (this.state_.lineWidth > this.maxLineWidth) {
    this.maxLineWidth = this.state_.lineWidth;
    // invalidate the buffered max extent cache
    this.bufferedMaxExtent_ = null;
  }
};
export default _ol_render_canvas_LineStringReplay_;
