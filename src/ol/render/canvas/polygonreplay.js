import _ol_ from '../../index';
import _ol_array_ from '../../array';
import _ol_color_ from '../../color';
import _ol_colorlike_ from '../../colorlike';
import _ol_extent_ from '../../extent';
import _ol_geom_flat_simplify_ from '../../geom/flat/simplify';
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
var _ol_render_canvas_PolygonReplay_ = function(tolerance, maxExtent, resolution, pixelRatio, overlaps) {

  _ol_render_canvas_Replay_.call(this, tolerance, maxExtent, resolution, pixelRatio, overlaps);

  /**
   * @private
   * @type {ol.Extent}
   */
  this.bufferedMaxExtent_ = null;

  /**
   * @private
   * @type {{currentFillStyle: (ol.ColorLike|undefined),
   *         currentStrokeStyle: (ol.ColorLike|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineDash: Array.<number>,
   *         currentLineDashOffset: (number|undefined),
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         fillStyle: (ol.ColorLike|undefined),
   *         strokeStyle: (ol.ColorLike|undefined),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineDashOffset: (number|undefined),
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined)}|null}
   */
  this.state_ = {
    currentFillStyle: undefined,
    currentStrokeStyle: undefined,
    currentLineCap: undefined,
    currentLineDash: null,
    currentLineDashOffset: undefined,
    currentLineJoin: undefined,
    currentLineWidth: undefined,
    currentMiterLimit: undefined,
    fillStyle: undefined,
    strokeStyle: undefined,
    lineCap: undefined,
    lineDash: null,
    lineDashOffset: undefined,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined
  };

};

_ol_.inherits(_ol_render_canvas_PolygonReplay_, _ol_render_canvas_Replay_);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
_ol_render_canvas_PolygonReplay_.prototype.drawFlatCoordinatess_ = function(flatCoordinates, offset, ends, stride) {
  var state = this.state_;
  var fill = state.fillStyle !== undefined;
  var stroke = state.strokeStyle != undefined;
  var numEnds = ends.length;
  var beginPathInstruction = [_ol_render_canvas_Instruction_.BEGIN_PATH];
  this.instructions.push(beginPathInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction);
  for (var i = 0; i < numEnds; ++i) {
    var end = ends[i];
    var myBegin = this.coordinates.length;
    var myEnd = this.appendFlatCoordinates(
        flatCoordinates, offset, end, stride, true, !stroke);
    var moveToLineToInstruction =
        [_ol_render_canvas_Instruction_.MOVE_TO_LINE_TO, myBegin, myEnd];
    this.instructions.push(moveToLineToInstruction);
    this.hitDetectionInstructions.push(moveToLineToInstruction);
    if (stroke) {
      // Performance optimization: only call closePath() when we have a stroke.
      // Otherwise the ring is closed already (see appendFlatCoordinates above).
      var closePathInstruction = [_ol_render_canvas_Instruction_.CLOSE_PATH];
      this.instructions.push(closePathInstruction);
      this.hitDetectionInstructions.push(closePathInstruction);
    }
    offset = end;
  }
  var fillInstruction = [_ol_render_canvas_Instruction_.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (fill) {
    this.instructions.push(fillInstruction);
  }
  if (stroke) {
    var strokeInstruction = [_ol_render_canvas_Instruction_.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  return offset;
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawCircle = function(circleGeometry, feature) {
  var state = this.state_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(circleGeometry);
  this.beginGeometry(circleGeometry, feature);
  // always fill the circle for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    _ol_color_.asString(_ol_render_canvas_.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var flatCoordinates = circleGeometry.getFlatCoordinates();
  var stride = circleGeometry.getStride();
  var myBegin = this.coordinates.length;
  this.appendFlatCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride, false, false);
  var beginPathInstruction = [_ol_render_canvas_Instruction_.BEGIN_PATH];
  var circleInstruction = [_ol_render_canvas_Instruction_.CIRCLE, myBegin];
  this.instructions.push(beginPathInstruction, circleInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction, circleInstruction);
  var fillInstruction = [_ol_render_canvas_Instruction_.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (state.fillStyle !== undefined) {
    this.instructions.push(fillInstruction);
  }
  if (state.strokeStyle !== undefined) {
    var strokeInstruction = [_ol_render_canvas_Instruction_.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  this.endGeometry(circleGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawPolygon = function(polygonGeometry, feature) {
  var state = this.state_;
  this.setFillStrokeStyles_(polygonGeometry);
  this.beginGeometry(polygonGeometry, feature);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    _ol_color_.asString(_ol_render_canvas_.defaultFillStyle)]
  );
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var ends = polygonGeometry.getEnds();
  var flatCoordinates = polygonGeometry.getOrientedFlatCoordinates();
  var stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
  this.endGeometry(polygonGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
  var state = this.state_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(multiPolygonGeometry);
  this.beginGeometry(multiPolygonGeometry, feature);
  // always fill the multi-polygon for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    _ol_color_.asString(_ol_render_canvas_.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var endss = multiPolygonGeometry.getEndss();
  var flatCoordinates = multiPolygonGeometry.getOrientedFlatCoordinates();
  var stride = multiPolygonGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = this.drawFlatCoordinatess_(
        flatCoordinates, offset, endss[i], stride);
  }
  this.endGeometry(multiPolygonGeometry, feature);
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.finish = function() {
  this.reverseHitDetectionInstructions();
  this.state_ = null;
  // We want to preserve topology when drawing polygons.  Polygons are
  // simplified using quantization and point elimination. However, we might
  // have received a mix of quantized and non-quantized geometries, so ensure
  // that all are quantized by quantizing all coordinates in the batch.
  var tolerance = this.tolerance;
  if (tolerance !== 0) {
    var coordinates = this.coordinates;
    var i, ii;
    for (i = 0, ii = coordinates.length; i < ii; ++i) {
      coordinates[i] = _ol_geom_flat_simplify_.snap(coordinates[i], tolerance);
    }
  }
};


/**
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.getBufferedMaxExtent = function() {
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
 * @inheritDoc
 */
_ol_render_canvas_PolygonReplay_.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  var state = this.state_;
  if (fillStyle) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = _ol_colorlike_.asColorLike(fillStyleColor ?
      fillStyleColor : _ol_render_canvas_.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (strokeStyle) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = _ol_colorlike_.asColorLike(strokeStyleColor ?
      strokeStyleColor : _ol_render_canvas_.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : _ol_render_canvas_.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash.slice() : _ol_render_canvas_.defaultLineDash;
    var strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    state.lineDashOffset = strokeStyleLineDashOffset ?
      strokeStyleLineDashOffset : _ol_render_canvas_.defaultLineDashOffset;
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : _ol_render_canvas_.defaultLineJoin;
    var strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : _ol_render_canvas_.defaultLineWidth;
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : _ol_render_canvas_.defaultMiterLimit;

    if (state.lineWidth > this.maxLineWidth) {
      this.maxLineWidth = state.lineWidth;
      // invalidate the buffered max extent cache
      this.bufferedMaxExtent_ = null;
    }
  } else {
    state.strokeStyle = undefined;
    state.lineCap = undefined;
    state.lineDash = null;
    state.lineDashOffset = undefined;
    state.lineJoin = undefined;
    state.lineWidth = undefined;
    state.miterLimit = undefined;
  }
};


/**
 * @private
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 */
_ol_render_canvas_PolygonReplay_.prototype.setFillStrokeStyles_ = function(geometry) {
  var state = this.state_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineDashOffset = state.lineDashOffset;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (fillStyle !== undefined && (typeof fillStyle !== 'string' || state.currentFillStyle != fillStyle)) {
    var fillInstruction = [_ol_render_canvas_Instruction_.SET_FILL_STYLE, fillStyle];
    if (typeof fillStyle !== 'string') {
      var fillExtent = geometry.getExtent();
      fillInstruction.push([fillExtent[0], fillExtent[3]]);
    }
    this.instructions.push(fillInstruction);
    state.currentFillStyle = state.fillStyle;
  }
  if (strokeStyle !== undefined) {
    if (state.currentStrokeStyle != strokeStyle ||
        state.currentLineCap != lineCap ||
        !_ol_array_.equals(state.currentLineDash, lineDash) ||
        state.currentLineDashOffset != lineDashOffset ||
        state.currentLineJoin != lineJoin ||
        state.currentLineWidth != lineWidth ||
        state.currentMiterLimit != miterLimit) {
      this.instructions.push([
        _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
        strokeStyle, lineWidth * this.pixelRatio, lineCap, lineJoin, miterLimit,
        this.applyPixelRatio(lineDash), lineDashOffset * this.pixelRatio
      ]);
      state.currentStrokeStyle = strokeStyle;
      state.currentLineCap = lineCap;
      state.currentLineDash = lineDash;
      state.currentLineDashOffset = lineDashOffset;
      state.currentLineJoin = lineJoin;
      state.currentLineWidth = lineWidth;
      state.currentMiterLimit = miterLimit;
    }
  }
};
export default _ol_render_canvas_PolygonReplay_;
