goog.provide('ol.render.canvas.PolygonReplay');

goog.require('ol');
goog.require('ol.color');
goog.require('ol.geom.flat.simplify');
goog.require('ol.render.canvas');
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
ol.render.canvas.PolygonReplay = function(
    tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  ol.render.canvas.Replay.call(this,
      tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree);
};
ol.inherits(ol.render.canvas.PolygonReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
ol.render.canvas.PolygonReplay.prototype.drawFlatCoordinatess_ = function(flatCoordinates, offset, ends, stride) {
  var state = this.state;
  var fill = state.fillStyle !== undefined;
  var stroke = state.strokeStyle != undefined;
  var numEnds = ends.length;
  var beginPathInstruction = [ol.render.canvas.Instruction.BEGIN_PATH];
  this.instructions.push(beginPathInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction);
  for (var i = 0; i < numEnds; ++i) {
    var end = ends[i];
    var myBegin = this.coordinates.length;
    var myEnd = this.appendFlatCoordinates(
        flatCoordinates, offset, end, stride, true, !stroke);
    var moveToLineToInstruction =
        [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myBegin, myEnd];
    this.instructions.push(moveToLineToInstruction);
    this.hitDetectionInstructions.push(moveToLineToInstruction);
    if (stroke) {
      // Performance optimization: only call closePath() when we have a stroke.
      // Otherwise the ring is closed already (see appendFlatCoordinates above).
      var closePathInstruction = [ol.render.canvas.Instruction.CLOSE_PATH];
      this.instructions.push(closePathInstruction);
      this.hitDetectionInstructions.push(closePathInstruction);
    }
    offset = end;
  }
  var fillInstruction = [ol.render.canvas.Instruction.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (fill) {
    this.instructions.push(fillInstruction);
  }
  if (stroke) {
    var strokeInstruction = [ol.render.canvas.Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawCircle = function(circleGeometry, feature) {
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
    ol.render.canvas.Instruction.SET_FILL_STYLE,
    ol.color.asString(ol.render.canvas.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var flatCoordinates = circleGeometry.getFlatCoordinates();
  var stride = circleGeometry.getStride();
  var myBegin = this.coordinates.length;
  this.appendFlatCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride, false, false);
  var beginPathInstruction = [ol.render.canvas.Instruction.BEGIN_PATH];
  var circleInstruction = [ol.render.canvas.Instruction.CIRCLE, myBegin];
  this.instructions.push(beginPathInstruction, circleInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction, circleInstruction);
  var fillInstruction = [ol.render.canvas.Instruction.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (state.fillStyle !== undefined) {
    this.instructions.push(fillInstruction);
  }
  if (state.strokeStyle !== undefined) {
    var strokeInstruction = [ol.render.canvas.Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  this.endGeometry(circleGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawPolygon = function(polygonGeometry, feature) {
  var state = this.state;
  this.setFillStrokeStyles_(polygonGeometry);
  this.beginGeometry(polygonGeometry, feature);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.SET_FILL_STYLE,
    ol.color.asString(ol.render.canvas.defaultFillStyle)]
  );
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
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
ol.render.canvas.PolygonReplay.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
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
    ol.render.canvas.Instruction.SET_FILL_STYLE,
    ol.color.asString(ol.render.canvas.defaultFillStyle)
  ]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
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
ol.render.canvas.PolygonReplay.prototype.finish = function() {
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
      coordinates[i] = ol.geom.flat.simplify.snap(coordinates[i], tolerance);
    }
  }
};


/**
 * @private
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyles_ = function(geometry) {
  var state = this.state;
  var fillStyle = state.fillStyle;
  if (fillStyle !== undefined) {
    this.updateFillStyle(state, this.applyFill, geometry);
  }
  if (state.strokeStyle !== undefined) {
    this.updateStrokeStyle(state, this.applyStroke);
  }
};
