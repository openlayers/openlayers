// FIXME store coordinates in batchgroup?
// FIXME flattened coordinates
// FIXME per-batch extent tests

goog.provide('ol.replay.canvas.BatchGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
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
 * @typedef {{beginPath: boolean,
 *            fillPending: boolean,
 *            fillStyle: ?ol.style.Fill,
 *            strokePending: boolean,
 *            strokeStyle: ?ol.style.Stroke}}
 */
ol.replay.canvas.State;



/**
 * @constructor
 * @implements {ol.replay.IBatch}
 */
ol.replay.canvas.Batch = function() {

  /**
   * @private
   * @type {Array}
   */
  this.instructions_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.coordinates_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.pixelCoordinates_ = [];

  /**
   * @private
   * @type {?ol.replay.canvas.State}
   */
  this.state_ = {
    beginPath: true,
    fillPending: false,
    fillStyle: null,
    strokePending: false,
    strokeStyle: null
  };

};


/**
 * @param {Array.<Array.<number>>} coordinates Coordinates.
 * @param {boolean} close Close.
 * @private
 * @return {number} End.
 */
ol.replay.canvas.Batch.prototype.appendCoordinates_ =
    function(coordinates, close) {
  goog.asserts.assert(!goog.isNull(this.state_));
  var end = this.coordinates_.length;
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    this.coordinates_[end++] = coordinates[i][0];
    this.coordinates_[end++] = coordinates[i][1];
  }
  if (close) {
    this.coordinates_[end++] = coordinates[0][0];
    this.coordinates_[end++] = coordinates[0][1];
  }
  return end;
};


/**
 * @private
 */
ol.replay.canvas.Batch.prototype.beginPath_ = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  if (this.state_.beginPath) {
    this.instructions_.push([ol.replay.canvas.Instruction.BEGIN_PATH]);
    this.state_.beginPath = false;
  }
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.canvas.Batch.prototype.draw = function(context, transform) {
  goog.asserts.assert(goog.isNull(this.state_));
  var pixelCoordinates = ol.replay.transformCoordinates(
      this.coordinates_, transform, this.pixelCoordinates_);
  this.pixelCoordinates_ = pixelCoordinates;  // FIXME ?
  var instructions = this.instructions_;
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
ol.replay.canvas.Batch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.beginPath_();
  var end = this.appendCoordinates_(lineStringGeometry.getCoordinates(), false);
  this.instructions_.push([ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, end]);
  this.state_.strokePending = true;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  var coordinatess = multiLineStringGeometry.getCoordinatess();
  var i, ii;
  for (i = 0, ii = coordinatess.length; i < ii; ++i) {
    this.beginPath_();
    var end = this.appendCoordinates_(coordinatess[i], false);
    this.instructions_.push(
        [ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, end]);
  }
  this.state_.strokePending = true;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  var ringss = multiPolygonGeometry.getRingss();
  var i, ii;
  for (i = 0, ii = ringss.length; i < ii; ++i) {
    var rings = ringss[i];
    var j, jj;
    for (j = 0, jj = rings.length; j < jj; ++j) {
      this.beginPath_();
      var end = this.appendCoordinates_(rings[j], true);
      this.instructions_.push(
          [ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, end],
          [ol.replay.canvas.Instruction.CLOSE_PATH]);
    }
  }
  this.state_.fillPending = true;
  this.state_.strokePending = true;
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  var rings = polygonGeometry.getRings();
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    this.beginPath_();
    var end = this.appendCoordinates_(rings[i], true);
    this.instructions_.push(
        [ol.replay.canvas.Instruction.MOVE_TO_LINE_TO, end],
        [ol.replay.canvas.Instruction.CLOSE_PATH]);
  }
  this.state_.fillPending = true;
  this.state_.strokePending = true;
};


/**
 * FIXME empty description for jsdoc
 */
ol.replay.canvas.Batch.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.flush_(true);
  this.state_ = null;
};


/**
 * @param {boolean} finish Finish.
 * @private
 */
ol.replay.canvas.Batch.prototype.flush_ = function(finish) {
  goog.asserts.assert(!goog.isNull(this.state_));
  if (this.state_.fillPending || this.state_.strokePending) {
    if (this.state_.fillPending) {
      this.instructions_.push([ol.replay.canvas.Instruction.FILL]);
      this.state_.fillPending = false;
    }
    if (this.state_.strokePending) {
      this.instructions_.push([ol.replay.canvas.Instruction.STROKE]);
      this.state_.strokePending = false;
    }
    this.state_.beginPath = true;
  }
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  // FIXME should only change styles before draws
  if (!ol.style.fill.equals(this.state_.fillStyle, fillStyle)) {
    this.flush_(false);
    this.instructions_.push(
        [ol.replay.canvas.Instruction.SET_FILL_STYLE, fillStyle]);
    this.state_.fillStyle = fillStyle;
  }
  if (!ol.style.stroke.equals(this.state_.strokeStyle, strokeStyle)) {
    this.flush_(false);
    this.instructions_.push(
        [ol.replay.canvas.Instruction.SET_STROKE_STYLE, strokeStyle]);
    this.state_.strokeStyle = strokeStyle;
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
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.canvas.BatchGroup.prototype.draw = function(context, transform) {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.batchesByZIndex_), Number);
  goog.array.sort(zs);
  var i, ii;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    var batches = this.batchesByZIndex_[zs[i].toString()];
    var batchType;
    for (batchType in batches) {
      var batch = batches[batchType];
      batch.draw(context, transform);
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
  'fillRing': ol.replay.canvas.Batch,
  'fillStrokeRing': ol.replay.canvas.Batch,
  'strokeLine': ol.replay.canvas.Batch,
  'strokeRing': ol.replay.canvas.Batch
};
