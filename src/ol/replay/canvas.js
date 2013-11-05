goog.provide('ol.replay.Canvas');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.replay');
goog.require('ol.replay.Base');
goog.require('ol.replay.Batch');
goog.require('ol.replay.FillStyle');
goog.require('ol.replay.StrokeStyle');


/**
 * @enum {number}
 */
ol.replay.CanvasInstructionId = {
  ADD_PATH: 0,
  BEGIN_PATH: 1,
  DRAW: 2,
  SET_FILL_STYLE: 3,
  SET_STROKE_STYLE: 4
};


/**
 * @typedef {{close: (boolean|undefined),
 *            command: ol.replay.CanvasInstructionId,
 *            fillStyle: (ol.replay.FillStyle|undefined),
 *            end: (number|undefined),
 *            start: (number|undefined),
 *            strokeStyle: (ol.replay.StrokeStyle|undefined)}}
 * }
 */
ol.replay.CanvasInstruction;



/**
 * @constructor
 * @extends {ol.replay.Batch}
 * @param {ol.replay.BatchType} type Type.
 * FIXME make this private?
 * FIXME accumulate all coordinates between style sets in a single array.
 * FIXME merge adjacent setStyles.
 */
ol.replay.CanvasBatch = function(type) {

  goog.base(this);

  /**
   * @private
   * @type {ol.replay.BatchType}
   */
  this.type_ = type;

  /**
   * @private
   * @type {Array.<ol.replay.CanvasInstruction>}
   */
  this.instructions_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.path_ = [];

};
goog.inherits(ol.replay.CanvasBatch, ol.replay.Batch);


/**
 * @inheritDoc
 */
ol.replay.CanvasBatch.prototype.addPath = function(path, stride, close) {
  goog.asserts.assert(this.type_ == ol.replay.BatchType.FILL ||
      this.type_ == ol.replay.BatchType.FILL_AND_STROKE ||
      this.type_ == ol.replay.BatchType.STROKE);
  var start = this.path_.length;
  if (stride == 2) {
    goog.array.extend(this.path_, path);
  } else {
    var m = path.length;
    var j = this.path_.length;
    var i;
    for (i = 0; i < m; i += stride) {
      this.path_[j++] = path[i];
      this.path_[j++] = path[i + 1];
    }
  }
  this.instructions_.push(/** @type {ol.replay.CanvasInstruction} */ ({
    command: ol.replay.CanvasInstructionId.ADD_PATH,
    close: close,
    end: this.path_.length,
    start: start
  }));
};


/**
 * @inheritDoc
 */
ol.replay.CanvasBatch.prototype.beginPath = function() {
  this.instructions_.push(/** @type {ol.replay.CanvasInstruction} */ ({
    command: ol.replay.CanvasInstructionId.BEGIN_PATH
  }));
};


/**
 * @inheritDoc
 */
ol.replay.CanvasBatch.prototype.draw = function() {
  this.instructions_.push(/** @type {ol.replay.CanvasInstruction} */ ({
    command: ol.replay.CanvasInstructionId.DRAW
  }));
};


/**
 * @inheritDoc
 */
ol.replay.CanvasBatch.prototype.setFillStyle = function(fillStyle) {
  goog.asserts.assert(this.type_ == ol.replay.BatchType.FILL ||
      this.type_ == ol.replay.BatchType.FILL_AND_STROKE);
  this.instructions_.push(/** @type {ol.replay.CanvasInstruction} */ ({
    command: ol.replay.CanvasInstructionId.SET_FILL_STYLE,
    fillStyle: fillStyle
  }));
};


/**
 * @inheritDoc
 */
ol.replay.CanvasBatch.prototype.setStrokeStyle = function(strokeStyle) {
  goog.asserts.assert(this.type_ == ol.replay.BatchType.FILL_AND_STROKE ||
      this.type_ == ol.replay.BatchType.STROKE);
  this.instructions_.push(/** @type {ol.replay.CanvasInstruction} */ ({
    command: ol.replay.CanvasInstructionId.SET_STROKE_STYLE,
    strokeStyle: strokeStyle
  }));
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.CanvasBatch.prototype.drawInternal = function(context, transform) {
  var fillStyle = null;
  var strokeStyle = null;
  var n = this.instructions_.length;
  var close, end, i, j, path, start;
  // FIXME re-use destination array
  // FIXME only re-transform if transform changed
  var pixelPath = ol.replay.transformPath(this.path_, transform);
  for (i = 0; i < n; ++i) {
    var instruction = this.instructions_[i];
    switch (instruction.command) {
      case ol.replay.CanvasInstructionId.ADD_PATH:
        end = instruction.end;
        goog.asserts.assert(goog.isDef(end));
        close = instruction.close;
        goog.asserts.assert(goog.isDef(close));
        start = instruction.start;
        goog.asserts.assert(goog.isDef(start));
        context.moveTo(pixelPath[start], pixelPath[start + 1]);
        for (j = start + 2; j < end; j += 2) {
          context.lineTo(pixelPath[j], pixelPath[j + 1]);
        }
        if (close) {
          context.closePath();
        }
        break;
      case ol.replay.CanvasInstructionId.BEGIN_PATH:
        context.beginPath();
        break;
      case ol.replay.CanvasInstructionId.DRAW:
        // FIXME handle alpha
        if (!goog.isNull(fillStyle)) {
          context.fillStyle = ol.replay.color(fillStyle.color);
          context.fill();
        }
        if (!goog.isNull(strokeStyle)) {
          context.lineWidth = strokeStyle.width;
          context.strokeStyle = ol.replay.color(strokeStyle.color);
          context.stroke();
        }
        break;
      case ol.replay.CanvasInstructionId.SET_FILL_STYLE:
        goog.asserts.assert(goog.isDef(instruction.fillStyle));
        fillStyle = instruction.fillStyle;
        break;
      case ol.replay.CanvasInstructionId.SET_STROKE_STYLE:
        goog.asserts.assert(goog.isDef(instruction.strokeStyle));
        strokeStyle = instruction.strokeStyle;
        break;
    }
  }
};



/**
 * @constructor
 * @extends {ol.replay.Base}
 * @param {CanvasRenderingContext2D} context Context.
 */
ol.replay.Canvas = function(context) {

  goog.base(this);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = context;

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumberIdentity();

};
goog.inherits(ol.replay.Canvas, ol.replay.Base);


/**
 * @inheritDoc
 */
ol.replay.Canvas.prototype.createBatch = function(batchType) {
  return new ol.replay.CanvasBatch(batchType);
};


/**
 * @inheritDoc
 */
ol.replay.Canvas.prototype.drawBatch = function(batch) {
  goog.asserts.assert(batch instanceof ol.replay.CanvasBatch);
  var canvasBatch = /** @type {ol.replay.CanvasBatch} */ (batch);
  canvasBatch.drawInternal(this.context_, this.transform_);
};


/**
 * @inheritDoc
 */
ol.replay.Canvas.prototype.setTransform = function(transform) {
  goog.vec.Mat4.setFromArray(this.transform_, transform);
};


/**
 * @param {ol.Color} color Color.
 * @return {string} Color.
 */
ol.replay.color = function(color) {
  // FIXME handle alpha
  return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
};
