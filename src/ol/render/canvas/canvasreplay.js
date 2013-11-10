// FIXME decide default snapToPixel behaviour

goog.provide('ol.render.canvas.BatchGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.render');
goog.require('ol.render.IRender');
goog.require('ol.render.IReplayBatchGroup');
goog.require('ol.style.fill');
goog.require('ol.style.stroke');


/**
 * @enum {number}
 */
ol.render.canvas.Instruction = {
  BEGIN_PATH: 0,
  CLOSE_PATH: 1,
  DRAW_IMAGE: 2,
  FILL: 3,
  MOVE_TO_LINE_TO: 4,
  SET_FILL_STYLE: 5,
  SET_STROKE_STYLE: 6,
  STROKE: 7
};



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @protected
 */
ol.render.canvas.Batch = function() {

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
ol.render.canvas.Batch.prototype.appendFlatCoordinates =
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
ol.render.canvas.Batch.prototype.draw = function(context, transform) {
  var pixelCoordinates = ol.render.transformFlatCoordinates(
      this.coordinates, 2, transform, this.pixelCoordinates_);
  this.pixelCoordinates_ = pixelCoordinates;  // FIXME ?
  var instructions = this.instructions;
  var i = 0;
  var end, j, jj;
  for (j = 0, jj = instructions.length; j < jj; ++j) {
    var instruction = instructions[j];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    if (type == ol.render.canvas.Instruction.BEGIN_PATH) {
      context.beginPath();
    } else if (type == ol.render.canvas.Instruction.CLOSE_PATH) {
      context.closePath();
    } else if (type == ol.render.canvas.Instruction.DRAW_IMAGE) {
      end = /** @type {number} */ (instruction[1]);
      var imageStyle = /** @type {ol.style.Image} */ (instruction[2]);
      for (; i < end; i += 2) {
        var x = pixelCoordinates[i] - imageStyle.anchor[0];
        var y = pixelCoordinates[i + 1] - imageStyle.anchor[1];
        if (imageStyle.snapToPixel) {
          x = (x + 0.5) | 0;
          y = (y + 0.5) | 0;
        }
        context.drawImage(imageStyle.image, x, y);
      }
    } else if (type == ol.render.canvas.Instruction.FILL) {
      context.fill();
    } else if (type == ol.render.canvas.Instruction.MOVE_TO_LINE_TO) {
      context.moveTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      goog.asserts.assert(goog.isNumber(instruction[1]));
      end = /** @type {number} */ (instruction[1]);
      for (i += 2; i < end; i += 2) {
        context.lineTo(pixelCoordinates[i], pixelCoordinates[i + 1]);
      }
    } else if (type == ol.render.canvas.Instruction.SET_FILL_STYLE) {
      goog.asserts.assert(goog.isObject(instruction[1]));
      var fillStyle = /** @type {ol.style.Fill} */ (instruction[1]);
      context.fillStyle = fillStyle.color;
    } else if (type == ol.render.canvas.Instruction.SET_STROKE_STYLE) {
      goog.asserts.assert(goog.isObject(instruction[1]));
      var strokeStyle = /** @type {ol.style.Stroke} */ (instruction[1]);
      context.strokeStyle = strokeStyle.color;
      context.lineWidth = strokeStyle.width;
    } else if (type == ol.render.canvas.Instruction.STROKE) {
      context.stroke();
    }
  }
  goog.asserts.assert(i == pixelCoordinates.length);
};


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawLineStringGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawMultiPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.drawMultiPolygonGeometry = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.Batch.prototype.finish = goog.nullFunction;


/**
 * @return {ol.Extent} Extent.
 */
ol.render.canvas.Batch.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.setFillStrokeStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Batch.prototype.setImageStyle = goog.abstractMethod;



/**
 * @constructor
 * @extends {ol.render.canvas.Batch}
 * @protected
 */
ol.render.canvas.ImageBatch = function() {

  goog.base(this);

  /**
   * @private
   * @type {?ol.style.Image}
   */
  this.imageStyle_ = null;

};
goog.inherits(ol.render.canvas.ImageBatch, ol.render.canvas.Batch);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} My end.
 */
ol.render.canvas.ImageBatch.prototype.drawCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  return this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageBatch.prototype.drawPointGeometry =
    function(pointGeometry) {
  goog.asserts.assert(!goog.isNull(this.imageStyle_));
  ol.extent.extend(this.extent_, pointGeometry.getExtent());
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push(
      [ol.render.canvas.Instruction.DRAW_IMAGE, myEnd, this.imageStyle_]);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageBatch.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
  goog.asserts.assert(!goog.isNull(this.imageStyle_));
  ol.extent.extend(this.extent_, multiPointGeometry.getExtent());
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push(
      [ol.render.canvas.Instruction.DRAW_IMAGE, myEnd, this.imageStyle_]);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageBatch.prototype.finish = function() {
  // FIXME this doesn't really protect us against further calls to draw*Geometry
  this.imageStyle_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageBatch.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Batch}
 * @protected
 */
ol.render.canvas.LineStringBatch = function() {

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
goog.inherits(ol.render.canvas.LineStringBatch, ol.render.canvas.Batch);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
ol.render.canvas.LineStringBatch.prototype.drawFlatCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  var state = this.state_;
  if (!ol.style.stroke.equals(state.currentStrokeStyle, state.strokeStyle)) {
    if (state.lastDraw != this.coordinates.length) {
      this.instructions.push([ol.render.canvas.Instruction.STROKE]);
    }
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE, state.strokeStyle],
        [ol.render.canvas.Instruction.BEGIN_PATH]);
    state.currentStrokeStyle = state.strokeStyle;
  }
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
  this.instructions.push([ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myEnd]);
  return end;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringBatch.prototype.drawLineStringGeometry =
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
ol.render.canvas.LineStringBatch.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
  goog.asserts.assert(!goog.isNull(this.state_));
  ol.extent.extend(this.extent_, multiLineStringGeometry.getExtent());
  var ends = multiLineStringGeometry.getEnds();
  var flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  var stride = multiLineStringGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    offset = this.drawFlatCoordinates_(
        flatCoordinates, offset, ends[i], stride);
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringBatch.prototype.finish = function() {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  if (state.lastDraw != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(goog.isNull(fillStyle));
  goog.asserts.assert(!goog.isNull(strokeStyle));
  this.state_.strokeStyle = strokeStyle;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Batch}
 * @protected
 */
ol.render.canvas.PolygonBatch = function() {

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
goog.inherits(ol.render.canvas.PolygonBatch, ol.render.canvas.Batch);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 */
ol.render.canvas.PolygonBatch.prototype.drawFlatCoordinatess_ =
    function(flatCoordinates, offset, ends, stride) {
  var state = this.state_;
  this.instructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var myEnd =
        this.appendFlatCoordinates(flatCoordinates, offset, end, stride, true);
    this.instructions.push(
        [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myEnd],
        [ol.render.canvas.Instruction.CLOSE_PATH]);
    offset = end;
  }
  // FIXME is it quicker to fill and stroke each polygon individually,
  // FIXME or all polygons together?
  if (!goog.isNull(state.fillStyle)) {
    this.instructions.push([ol.render.canvas.Instruction.FILL]);
  }
  if (!goog.isNull(state.strokeStyle)) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonBatch.prototype.drawPolygonGeometry =
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
ol.render.canvas.PolygonBatch.prototype.drawMultiPolygonGeometry =
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
ol.render.canvas.PolygonBatch.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(!goog.isNull(fillStyle) || !goog.isNull(strokeStyle));
  this.state_.fillStyle = fillStyle;
  this.state_.strokeStyle = strokeStyle;
};


/**
 * @private
 */
ol.render.canvas.PolygonBatch.prototype.setFillStrokeStyles_ = function() {
  var state = this.state_;
  if (!goog.isNull(state.fillStyle) &&
      !ol.style.fill.equals(state.currentFillStyle, state.fillStyle)) {
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_FILL_STYLE, state.fillStyle]);
    state.currentFillStyle = state.fillStyle;
  }
  if (!goog.isNull(state.strokeStyle) &&
      !ol.style.stroke.equals(state.currentStrokeStyle, state.strokeStyle)) {
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE, state.strokeStyle]);
    state.currentStrokeStyle = state.strokeStyle;
  }
};



/**
 * @constructor
 * @implements {ol.render.IReplayBatchGroup}
 */
ol.render.canvas.BatchGroup = function() {

  /**
   * @private
   * @type {Object.<string,
   *        Object.<ol.render.BatchType, ol.render.canvas.Batch>>}
   */
  this.batchesByZIndex_ = {};

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.BatchGroup.prototype.draw =
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
ol.render.canvas.BatchGroup.prototype.finish = function() {
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
ol.render.canvas.BatchGroup.prototype.getBatch = function(zIndex, batchType) {
  var zIndexKey = goog.isDef(zIndex) ? zIndex.toString() : '0';
  var batches = this.batchesByZIndex_[zIndexKey];
  if (!goog.isDef(batches)) {
    batches = {};
    this.batchesByZIndex_[zIndexKey] = batches;
  }
  var batch = batches[batchType];
  if (!goog.isDef(batch)) {
    var constructor = ol.render.canvas.BATCH_CONSTRUCTORS_[batchType];
    goog.asserts.assert(goog.isDef(constructor));
    batch = new constructor();
    batches[batchType] = batch;
  }
  return batch;
};


/**
 * @inheritDoc
 */
ol.render.canvas.BatchGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.batchesByZIndex_);
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.BatchType, function(new: ol.render.canvas.Batch)>}
 */
ol.render.canvas.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageBatch,
  'LineString': ol.render.canvas.LineStringBatch,
  'Polygon': ol.render.canvas.PolygonBatch
};
