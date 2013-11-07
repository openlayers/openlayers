// FIXME store coordinates in batchgroup?
// FIXME flattened coordinates
// FIXME per-batch extent tests

goog.provide('ol.replay.canvas.BatchGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.replay');
goog.require('ol.replay.IBatch');
goog.require('ol.replay.IBatchGroup');


/**
 * @enum {number}
 */
ol.replay.canvas.InstructionType = {
  DRAW_LINE_STRING_GEOMETRY: 0,
  SET_STROKE_STYLE: 1
};


/**
 * @typedef {{argument: ?,
 *            type: ol.replay.canvas.InstructionType}}
 */
ol.replay.canvas.Instruction;



/**
 * @constructor
 * @implements {ol.replay.IBatch}
 */
ol.replay.canvas.Batch = function() {

  /**
   * @private
   * @type {Array.<ol.replay.canvas.Instruction>}
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

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.canvas.Batch.prototype.draw = function(context, transform) {
  var pixelCoordinates = ol.replay.transformCoordinates(
      this.coordinates_, transform, this.pixelCoordinates_);
  this.pixelCoordinates_ = pixelCoordinates;  // FIXME ?
  var begunPath = false;
  var fillPending = false;
  var strokePending = false;
  var flushPath = function() {
    if (strokePending || fillPending) {
      if (strokePending) {
        context.stroke();
        strokePending = false;
      }
      if (fillPending) {
        context.fill();
        fillPending = false;
      }
      context.beginPath();
      begunPath = true;
    }
  };
  var instructions = this.instructions_;
  var i = 0;
  var j, jj;
  for (j = 0, jj = instructions.length; j < jj; ++j) {
    var instruction = instructions[j];
    if (instruction.type ==
        ol.replay.canvas.InstructionType.DRAW_LINE_STRING_GEOMETRY) {
      if (!begunPath) {
        context.beginPath();
        begunPath = true;
      }
      context.moveTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      goog.asserts.assert(goog.isNumber(instruction.argument));
      var ii = /** @type {number} */ (instruction.argument);
      for (i += 2; i < ii; i += 2) {
        context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      }
      strokePending = true;
    } else if (instruction.type ==
        ol.replay.canvas.InstructionType.SET_STROKE_STYLE) {
      flushPath();
      goog.asserts.assert(goog.isObject(instruction.argument));
      var strokeStyle = /** @type {ol.style.Stroke} */ (instruction.argument);
      context.strokeStyle = strokeStyle.color;
      context.lineWidth = strokeStyle.width;
    }
  }
  flushPath();
  goog.asserts.assert(i == pixelCoordinates.length);
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
  var coordinates = this.coordinates_;
  var lineStringCoordinates = lineStringGeometry.getCoordinates();
  var i = coordinates.length;
  var j, jj;
  for (j = 0, jj = lineStringCoordinates.length; j < jj; ++j) {
    coordinates[i++] = lineStringCoordinates[j][0];
    coordinates[i++] = lineStringCoordinates[j][1];
  }
  this.instructions_.push({
    type: ol.replay.canvas.InstructionType.DRAW_LINE_STRING_GEOMETRY,
    argument: i
  });
};


/**
 * @inheritDoc
 */
ol.replay.canvas.Batch.prototype.setStrokeStyle = function(strokeStyle) {
  this.instructions_.push({
    type: ol.replay.canvas.InstructionType.SET_STROKE_STYLE,
    argument: strokeStyle
  });
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
  window.console.log('drawing batch');
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
ol.replay.canvas.BatchGroup.prototype.getBatch = function(zIndex, batchType) {
  var zIndexKey = zIndex.toString();
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
ol.replay.canvas.BatchGroup.prototype.isEmpty = goog.functions.FALSE; // FIXME


/**
 * @const
 * @private
 * @type {Object.<ol.replay.BatchType, function(new: ol.replay.canvas.Batch)>}
 */
ol.replay.canvas.BATCH_CONSTRUCTORS_ = {
  'strokeLine': ol.replay.canvas.Batch
};
