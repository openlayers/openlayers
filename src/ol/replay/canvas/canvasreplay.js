// FIXME flattened coordinates

goog.provide('ol.replay.canvas.BatchGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.replay');
goog.require('ol.replay.IBatch');
goog.require('ol.replay.IBatchGroup');
goog.require('ol.style.fill');
goog.require('ol.style.stroke');


/**
 * @enum {number}
 */
ol.replay.canvas.Instruction = {
  BEGIN_PATH: 0,
  CLOSE_PATH: 1,
  FILL: 2,
  MOVE_TO_LINE_TO: 3,
  SET_FILL_STYLE: 4,
  SET_STROKE_STYLE: 5,
  STROKE: 6
};



/**
 * @constructor
 * @implements {ol.replay.IBatch}
 * @protected
 */
ol.replay.canvas.Batch = function() {

  /**
   * @protected
   * @type {Array}
   */
  this.instructions = [];

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.coordinates = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = ol.extent.createEmpty();

};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 * @protected
 * @return {number} My end.
 */
ol.replay.canvas.Batch.prototype.appendFlatCoordinates =
    function(flatCoordinates, offset, end, stride, close) {
  var myEnd = this.coordinates.length;
  var i;
  for (i = offset; i < end; i += stride) {
    this.coordinates[myEnd++] = flatCoordinates[i];
    this.coordinates[myEnd++] = flatCoordinates[i + 1];
  }
  if (close) {
    this.coordinates[myEnd++] = flatCoordinates[offset];
    this.coordinates[myEnd++] = flatCoordinates[offset + 1];
  }
  return myEnd;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.canvas.Batch.prototype.draw = function(context, transform) {
  var pixelCoordinates = ol.replay.transformCoordinates(
      this.coordinates, transform, this.pixelCoordinates_);
  this.pixelCoordinates_ = pixelCoordinates;  // FIXME ?
  var instructions = this.instructions;
  var i = 0;
  var j, jj;
  for (j = 0, jj = instructions.length; j < jj; ++j) {
    var instruction = instructions[j];
    var type = instruction[0];
    if (type == ol.replay.canvas.Instruction.BEGIN_PATH) {
      context.beginPath();
    } else if (type == ol.replay.canvas.Instruction.CLOSE_PATH) {
      context.closePath();
    } else if (type == ol.replay.canvas.Instruction.FILL) {
      context.fill();
    } else if (type == ol.replay.canvas.Instruction.MOVE_TO_LINE_TO) {
      context.moveTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      goog.asserts.assert(goog.isNumber(instruction[1]));
      var end = /** @type {number} */ (instruction[1]);
      for (i += 2; i < end; i += 2) {
        context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      }
    } else if (type == ol.replay.canvas.Instruction.SET_FILL_STYLE) {
      goog.asserts.assert(goog.isObject(instruction[1]));
      var fillStyle = /** @type {ol.style.Fill} */ (instruction[1]);
      context.fillStyle = fillStyle.color;
    } else if (type == ol.replay.canvas.Instruction.SET_STROKE_STYLE) {
      goog.asserts.assert(goog.isObject(instruction[1]));
      var strokeStyle = /** @type {ol.style.Stroke} */ (instruction[1]);
      context.strokeStyle = strokeStyle.color;
      context.lineWidth = strokeStyle.width;
    } else if (type == ol.replay.canvas.Instruction.STROKE) {
      context.stroke();
    }
  }
  goog.asserts.assert(i == pixelCoordinates.length);
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawLineStringGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawMultiPolygonGeometry = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.replay.canvas.Batch.prototype.finish = goog.nullFunction;


/**
 * @return {ol.Extent} Extent.
 */
ol.replay.canvas.Batch.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.setFillStrokeStyle = goog.abstractMethod;



/**
 * @constructor
 * @extends {ol.replay.canvas.Batch}
 * @protected
 */
ol.replay.canvas.LineStringBatch = function() {

  goog.base(this);

  /**
   * @private
   * @type {{currentStrokeStyle: ?ol.style.Stroke,
   *         lastDraw: number,
   *         strokeStyle: ?ol.style.Stroke}|null}
   */
  this.state_ = {
    currentStrokeStyle: null,
    lastDraw: 0,
    strokeStyle: null
  };

};
goog.inherits(ol.replay.canvas.LineStringBatch, ol.replay.canvas.Batch);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 */
ol.replay.canvas.LineStringBatch.prototype.drawFlatCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  var state = this.state_;
  if (!ol.style.stroke.equals(state.currentStrokeStyle, state.strokeStyle)) {
    if (state.lastDraw != this.coordinates.length) {
      this.instructions.push([ol.replay.canvas.Instruction.STROKE]);
    }
    this.instructions.push(
        [ol.replay.canvas.Instruction.SET_STROKE_STYLE, state.strokeStyle],
        [ol.replay.canvas.Instruction.BEGIN_PATH]);
    state.currentStrokeStyle = state.strokeStyle;
  }
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
  this.instructions.push([ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, myEnd]);
};


/**
 * @inheritDoc
 */
ol.replay.canvas.LineStringBatch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  ol.extent.extend(this.extent_, lineStringGeometry.getExtent());
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
};


/**
 * @inheritDoc
 */
ol.replay.canvas.LineStringBatch.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  ol.extent.extend(this.extent_, multiLineStringGeometry.getExtent());
  var ends = multiLineStringGeometry.getEnds();
  var flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  var stride = multiLineStringGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    this.drawFlatCoordinates_(flatCoordinates, offset, end, stride);
    offset = end;
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.LineStringBatch.prototype.finish = function() {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  if (state.lastDraw != this.coordinates.length) {
    this.instructions.push([ol.replay.canvas.Instruction.STROKE]);
  }
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.LineStringBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(goog.isNull(fillStyle));
  goog.asserts.assert(!goog.isNull(strokeStyle));
  this.state_.strokeStyle = strokeStyle;
};



/**
 * @constructor
 * @extends {ol.replay.canvas.Batch}
 * @protected
 */
ol.replay.canvas.PolygonBatch = function() {

  goog.base(this);

  /**
   * @private
   * @type {{currentFillStyle: ?ol.style.Fill,
   *         currentStrokeStyle: ?ol.style.Stroke,
   *         fillStyle: ?ol.style.Fill,
   *         strokeStyle: ?ol.style.Stroke}|null}
   */
  this.state_ = {
    currentFillStyle: null,
    currentStrokeStyle: null,
    fillStyle: null,
    strokeStyle: null
  };

};
goog.inherits(ol.replay.canvas.PolygonBatch, ol.replay.canvas.Batch);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 */
ol.replay.canvas.PolygonBatch.prototype.drawFlatCoordinatess_ =
    function(flatCoordinates, offset, ends, stride) {
  var state = this.state_;
  this.instructions.push([ol.replay.canvas.Instruction.BEGIN_PATH]);
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var myEnd =
        this.appendFlatCoordinates(flatCoordinates, offset, end, stride, true);
    this.instructions.push(
        [ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, myEnd],
        [ol.replay.canvas.Instruction.CLOSE_PATH]);
    offset = end;
  }
  // FIXME is it quicker to fill and stroke each polygon individually,
  // FIXME or all polygons together?
  if (!goog.isNull(state.fillStyle)) {
    this.instructions.push([ol.replay.canvas.Instruction.FILL]);
  }
  if (!goog.isNull(state.strokeStyle)) {
    this.instructions.push([ol.replay.canvas.Instruction.STROKE]);
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.PolygonBatch.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  ol.extent.extend(this.extent_, polygonGeometry.getExtent());
  this.setFillStrokeStyles_();
  var ends = polygonGeometry.getEnds();
  var flatCoordinates = polygonGeometry.getFlatCoordinates();
  var stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
};


/**
 * @inheritDoc
 */
ol.replay.canvas.PolygonBatch.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  ol.extent.extend(this.extent_, multiPolygonGeometry.getExtent());
  this.setFillStrokeStyles_();
  var endss = multiPolygonGeometry.getEndss();
  var flatCoordinates = multiPolygonGeometry.getFlatCoordinates();
  var stride = multiPolygonGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    this.drawFlatCoordinatess_(flatCoordinates, offset, ends, stride);
    offset = ends[ends.length - 1];
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.PolygonBatch.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.PolygonBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(!goog.isNull(fillStyle) || !goog.isNull(strokeStyle));
  this.state_.fillStyle = fillStyle;
  this.state_.strokeStyle = strokeStyle;
};


/**
 * @private
 */
ol.replay.canvas.PolygonBatch.prototype.setFillStrokeStyles_ = function() {
  var state = this.state_;
  if (!goog.isNull(state.fillStyle) &&
      !ol.style.fill.equals(state.currentFillStyle, state.fillStyle)) {
    this.instructions.push(
        [ol.replay.canvas.Instruction.SET_FILL_STYLE, state.fillStyle]);
    state.currentFillStyle = state.fillStyle;
  }
  if (!goog.isNull(state.strokeStyle) &&
      !ol.style.stroke.equals(state.currentStrokeStyle, state.strokeStyle)) {
    this.instructions.push(
        [ol.replay.canvas.Instruction.SET_STROKE_STYLE, state.strokeStyle]);
    state.currentStrokeStyle = state.strokeStyle;
  }
};



/**
 * @constructor
 * @implements {ol.replay.IBatchGroup}
 */
ol.replay.canvas.BatchGroup = function() {

  /**
   * @private
   * @type {Object.<string,
   *        Object.<ol.replay.BatchType, ol.replay.canvas.Batch>>}
   */
  this.batchesByZIndex_ = {};

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.canvas.BatchGroup.prototype.draw =
    function(context, extent, transform) {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.batchesByZIndex_), Number);
  goog.array.sort(zs);
  var i, ii;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    var batches = this.batchesByZIndex_[zs[i].toString()];
    var batchType;
    for (batchType in batches) {
      var batch = batches[batchType];
      if (ol.extent.intersects(extent, batch.getExtent())) {
        batch.draw(context, transform);
      }
    }
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.BatchGroup.prototype.finish = function() {
  var zKey;
  for (zKey in this.batchesByZIndex_) {
    var batches = this.batchesByZIndex_[zKey];
    var batchKey;
    for (batchKey in batches) {
      batches[batchKey].finish();
    }
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.BatchGroup.prototype.getBatch = function(zIndex, batchType) {
  var zIndexKey = goog.isDef(zIndex) ? zIndex.toString() : '0';
  var batches = this.batchesByZIndex_[zIndexKey];
  if (!goog.isDef(batches)) {
    batches = {};
    this.batchesByZIndex_[zIndexKey] = batches;
  }
  var batch = batches[batchType];
  if (!goog.isDef(batch)) {
    var constructor = ol.replay.canvas.BATCH_CONSTRUCTORS_[batchType];
    goog.asserts.assert(goog.isDef(constructor));
    batch = new constructor();
    batches[batchType] = batch;
  }
  return batch;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.BatchGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.batchesByZIndex_);
};


/**
 * @const
 * @private
 * @type {Object.<ol.replay.BatchType, function(new: ol.replay.canvas.Batch)>}
 */
ol.replay.canvas.BATCH_CONSTRUCTORS_ = {
  'LineString': ol.replay.canvas.LineStringBatch,
  'Polygon': ol.replay.canvas.PolygonBatch
};
