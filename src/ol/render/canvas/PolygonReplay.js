/**
 * @module ol/render/canvas/PolygonReplay
 */
import {inherits} from '../../index.js';
import {asString} from '../../color.js';
import _ol_geom_flat_simplify_ from '../../geom/flat/simplify.js';
import _ol_render_canvas_ from '../canvas.js';
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
var _ol_render_canvas_PolygonReplay_ = function(
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  _ol_render_canvas_Replay_.call(this,
      tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};

inherits(_ol_render_canvas_PolygonReplay_, _ol_render_canvas_Replay_);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
_ol_render_canvas_PolygonReplay_.prototype.drawFlatCoordinatess_ = function(flatCoordinates, offset, ends, stride) {
  var state = this.state;
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
  var state = this.state;
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
    asString(_ol_render_canvas_.defaultFillStyle)
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
  var state = this.state;
  this.setFillStrokeStyles_(polygonGeometry);
  this.beginGeometry(polygonGeometry, feature);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push([
    _ol_render_canvas_Instruction_.SET_FILL_STYLE,
    asString(_ol_render_canvas_.defaultFillStyle)]
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
  var state = this.state;
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
    asString(_ol_render_canvas_.defaultFillStyle)
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
  this.state = null;
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
 * @private
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 */
_ol_render_canvas_PolygonReplay_.prototype.setFillStrokeStyles_ = function(geometry) {
  var state = this.state;
  var fillStyle = state.fillStyle;
  if (fillStyle !== undefined) {
    this.updateFillStyle(state, this.createFill, geometry);
  }
  if (state.strokeStyle !== undefined) {
    this.updateStrokeStyle(state, this.applyStroke);
  }
};
export default _ol_render_canvas_PolygonReplay_;
