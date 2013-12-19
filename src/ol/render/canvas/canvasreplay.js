// FIXME decide default snapToPixel behaviour
// FIXME add option to apply snapToPixel to all coordinates?
// FIXME can eliminate empty set styles and strokes (when all geoms skipped)

goog.provide('ol.render.canvas.ReplayGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');
goog.require('ol.render.IRender');
goog.require('ol.render.IReplayGroup');
goog.require('ol.render.canvas');
goog.require('ol.vec.Mat4');


/**
 * @enum {number}
 */
ol.render.canvas.Instruction = {
  BEGIN_GEOMETRY: 0,
  BEGIN_PATH: 1,
  CLOSE_PATH: 2,
  DRAW_IMAGE: 3,
  END_GEOMETRY: 4,
  FILL: 5,
  MOVE_TO_LINE_TO: 6,
  SET_FILL_STYLE: 7,
  SET_STROKE_STYLE: 8,
  STROKE: 9
};



/**
 * @constructor
 * @implements {ol.render.IRender}
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.canvas.Replay = function(pixelRatio, tolerance) {

  /**
   * @protected
   * @type {number}
   */
  this.pixelRatio = pixelRatio;

  /**
   * @protected
   * @type {number}
   */
  this.tolerance = tolerance;

  /**
   * @private
   * @type {Array.<*>}
   */
  this.beginGeometryInstruction1_ = null;

  /**
   * @private
   * @type {Array.<*>}
   */
  this.beginGeometryInstruction2_ = null;

  /**
   * @protected
   * @type {Array.<*>}
   */
  this.instructions = [];

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.coordinates = [];

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.renderedTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @protected
   * @type {Array.<*>}
   */
  this.hitDetectionInstructions = [];

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

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpLocalTransform_ = goog.vec.Mat4.createNumber();

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
ol.render.canvas.Replay.prototype.appendFlatCoordinates =
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
 * @protected
 * @param {ol.geom.Geometry} geometry Geometry.
 */
ol.render.canvas.Replay.prototype.beginGeometry = function(geometry) {
  this.beginGeometryInstruction1_ =
      [ol.render.canvas.Instruction.BEGIN_GEOMETRY, geometry, 0];
  this.instructions.push(this.beginGeometryInstruction1_);
  this.beginGeometryInstruction2_ =
      [ol.render.canvas.Instruction.BEGIN_GEOMETRY, geometry, 0];
  this.hitDetectionInstructions.push(this.beginGeometryInstruction2_);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @param {Array.<*>} instructions Instructions array.
 * @param {function(ol.geom.Geometry, Object): T|undefined} geometryCallback
 *     Geometry callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.Replay.prototype.replay_ =
    function(context, transform, renderGeometryFunction, instructions,
        geometryCallback) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (ol.vec.Mat4.equals2D(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    pixelCoordinates = ol.geom.flat.transform2D(
        this.coordinates, 2, transform, this.pixelCoordinates_);
    goog.vec.Mat4.setFromArray(this.renderedTransform_, transform);
    goog.asserts.assert(pixelCoordinates === this.pixelCoordinates_);
  }
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d; // data index
  var dd; // end of per-instruction data
  var localTransform = this.tmpLocalTransform_;
  while (i < ii) {
    var instruction = instructions[i];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    var geometry;
    if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      geometry = /** @type {ol.geom.Geometry} */ (instruction[1]);
      if (renderGeometryFunction(geometry)) {
        ++i;
      } else {
        i = /** @type {number} */ (instruction[2]);
      }
    } else if (type == ol.render.canvas.Instruction.BEGIN_PATH) {
      context.beginPath();
      ++i;
    } else if (type == ol.render.canvas.Instruction.CLOSE_PATH) {
      context.closePath();
      ++i;
    } else if (type == ol.render.canvas.Instruction.DRAW_IMAGE) {
      goog.asserts.assert(goog.isNumber(instruction[1]));
      d = /** @type {number} */ (instruction[1]);
      goog.asserts.assert(goog.isNumber(instruction[2]));
      dd = /** @type {number} */ (instruction[2]);
      var image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
          (instruction[3]);
      // Remaining arguments in DRAW_IMAGE are in alphabetical order
      var anchorX = /** @type {number} */ (instruction[4]);
      var anchorY = /** @type {number} */ (instruction[5]);
      var height = /** @type {number} */ (instruction[6]);
      var rotation = /** @type {number} */ (instruction[7]);
      var scale = /** @type {number} */ (instruction[8]);
      var snapToPixel = /** @type {boolean|undefined} */ (instruction[9]);
      var width = /** @type {number} */ (instruction[10]);
      for (; d < dd; d += 2) {
        var x = pixelCoordinates[d] - anchorX;
        var y = pixelCoordinates[d + 1] - anchorY;
        if (snapToPixel) {
          x = (x + 0.5) | 0;
          y = (y + 0.5) | 0;
        }
        if (scale != 1 || rotation !== 0) {
          ol.vec.Mat4.makeTransform2D(
              localTransform, x, y, scale, scale, rotation, -x, -y);
          context.setTransform(
              goog.vec.Mat4.getElement(localTransform, 0, 0),
              goog.vec.Mat4.getElement(localTransform, 1, 0),
              goog.vec.Mat4.getElement(localTransform, 0, 1),
              goog.vec.Mat4.getElement(localTransform, 1, 1),
              goog.vec.Mat4.getElement(localTransform, 0, 3),
              goog.vec.Mat4.getElement(localTransform, 1, 3));
        }
        context.drawImage(image, x, y, width, height);
        if (scale != 1 || rotation !== 0) {
          context.setTransform(1, 0, 0, 1, 0, 0);
        }
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.END_GEOMETRY) {
      if (goog.isDef(geometryCallback)) {
        geometry = /** @type {ol.geom.Geometry} */ (instruction[1]);
        var data = /** @type {Object} */ (instruction[2]);
        var result = geometryCallback(geometry, data);
        if (result) {
          return result;
        }
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.FILL) {
      context.fill();
      ++i;
    } else if (type == ol.render.canvas.Instruction.MOVE_TO_LINE_TO) {
      goog.asserts.assert(goog.isNumber(instruction[1]));
      d = /** @type {number} */ (instruction[1]);
      goog.asserts.assert(goog.isNumber(instruction[2]));
      dd = /** @type {number} */ (instruction[2]);
      context.moveTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
      for (d += 2; d < dd; d += 2) {
        context.lineTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.SET_FILL_STYLE) {
      goog.asserts.assert(goog.isString(instruction[1]));
      context.fillStyle = /** @type {string} */ (instruction[1]);
      ++i;
    } else if (type == ol.render.canvas.Instruction.SET_STROKE_STYLE) {
      goog.asserts.assert(goog.isString(instruction[1]));
      goog.asserts.assert(goog.isNumber(instruction[2]));
      goog.asserts.assert(goog.isString(instruction[3]));
      goog.asserts.assert(goog.isString(instruction[4]));
      goog.asserts.assert(goog.isNumber(instruction[5]));
      goog.asserts.assert(!goog.isNull(instruction[6]));
      context.strokeStyle = /** @type {string} */ (instruction[1]);
      context.lineWidth = /** @type {number} */ (instruction[2]);
      context.lineCap = /** @type {string} */ (instruction[3]);
      context.lineJoin = /** @type {string} */ (instruction[4]);
      context.miterLimit = /** @type {number} */ (instruction[5]);
      if (goog.isDef(context.setLineDash)) {
        context.setLineDash(/** @type {Array.<number>} */ (instruction[6]));
      }
      ++i;
    } else if (type == ol.render.canvas.Instruction.STROKE) {
      context.stroke();
      ++i;
    } else {
      goog.asserts.fail();
      ++i; // consume the instruction anyway, to avoid an infinite loop
    }
  }
  // assert that all instructions were consumed
  goog.asserts.assert(i == instructions.length);
  return undefined;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.Replay.prototype.replay =
    function(context, transform, renderGeometryFunction) {
  var instructions = this.instructions;
  return this.replay_(context, transform, renderGeometryFunction,
      instructions, undefined);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @param {function(ol.geom.Geometry, Object): T=} opt_geometryCallback
 *     Geometry callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.Replay.prototype.replayHitDetection =
    function(context, transform, renderGeometryFunction, opt_geometryCallback) {
  var instructions = this.hitDetectionInstructions;
  return this.replay_(context, transform, renderGeometryFunction,
      instructions, opt_geometryCallback);
};


/**
 * @private
 */
ol.render.canvas.Replay.prototype.reverseHitDetectionInstructions_ =
    function() {
  var hitDetectionInstructions = this.hitDetectionInstructions;
  // step 1 - reverse array
  hitDetectionInstructions.reverse();
  // step 2 - reverse instructions within geometry blocks
  var i;
  var n = hitDetectionInstructions.length;
  var instruction;
  var type;
  var begin = -1;
  for (i = 0; i < n; ++i) {
    instruction = hitDetectionInstructions[i];
    type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    if (type == ol.render.canvas.Instruction.END_GEOMETRY) {
      goog.asserts.assert(begin == -1);
      begin = i;
    } else if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      goog.asserts.assert(begin >= 0);
      ol.array.reverseSubArray(this.hitDetectionInstructions, begin, i);
      begin = -1;
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawFeature = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawGeometryCollectionGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawLineStringGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiLineStringGeometry =
    goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiPointGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawPolygonGeometry = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.drawMultiPolygonGeometry =
    goog.abstractMethod;


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Object} data Opaque data object.
 */
ol.render.canvas.Replay.prototype.endGeometry =
    function(geometry, data) {
  goog.asserts.assert(!goog.isNull(this.beginGeometryInstruction1_));
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
  goog.asserts.assert(!goog.isNull(this.beginGeometryInstruction2_));
  this.beginGeometryInstruction2_[2] = this.hitDetectionInstructions.length;
  this.beginGeometryInstruction2_ = null;
  var endGeometryInstruction =
      [ol.render.canvas.Instruction.END_GEOMETRY, geometry, data];
  this.instructions.push(endGeometryInstruction);
  this.hitDetectionInstructions.push(endGeometryInstruction);
};


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.Replay.prototype.finish = goog.nullFunction;


/**
 * @return {ol.Extent} Extent.
 */
ol.render.canvas.Replay.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setFillStrokeStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setImageStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setTextStyle = goog.abstractMethod;



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.canvas.ImageReplay = function(pixelRatio, tolerance) {

  goog.base(this, pixelRatio, tolerance);

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.hitDetectionImage_ = null;

  /**
   * @private
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.anchorY_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.height_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.rotation_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.scale_ = undefined;

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.snapToPixel_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.width_ = undefined;

};
goog.inherits(ol.render.canvas.ImageReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} My end.
 */
ol.render.canvas.ImageReplay.prototype.drawCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  return this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawPointGeometry =
    function(pointGeometry, data) {
  if (goog.isNull(this.image_)) {
    return;
  }
  goog.asserts.assert(goog.isDef(this.anchorX_));
  goog.asserts.assert(goog.isDef(this.anchorY_));
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.rotation_));
  goog.asserts.assert(goog.isDef(this.scale_));
  goog.asserts.assert(goog.isDef(this.width_));
  ol.extent.extend(this.extent_, pointGeometry.getExtent());
  this.beginGeometry(pointGeometry);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.rotation_, this.scale_,
    this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.rotation_, this.scale_,
    this.snapToPixel_, this.width_
  ]);
  this.endGeometry(pointGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
  if (goog.isNull(this.image_)) {
    return;
  }
  goog.asserts.assert(goog.isDef(this.anchorX_));
  goog.asserts.assert(goog.isDef(this.anchorY_));
  goog.asserts.assert(goog.isDef(this.height_));
  goog.asserts.assert(goog.isDef(this.rotation_));
  goog.asserts.assert(goog.isDef(this.scale_));
  goog.asserts.assert(goog.isDef(this.width_));
  ol.extent.extend(this.extent_, multiPointGeometry.getExtent());
  this.beginGeometry(multiPointGeometry);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.rotation_, this.scale_,
    this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.rotation_, this.scale_,
    this.snapToPixel_, this.width_
  ]);
  this.endGeometry(multiPointGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.finish = function() {
  this.reverseHitDetectionInstructions_();
  // FIXME this doesn't really protect us against further calls to draw*Geometry
  this.anchorX_ = undefined;
  this.anchorY_ = undefined;
  this.hitDetectionImage_ = null;
  this.image_ = null;
  this.height_ = undefined;
  this.scale_ = undefined;
  this.rotation_ = undefined;
  this.snapToPixel_ = undefined;
  this.width_ = undefined;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  goog.asserts.assert(!goog.isNull(imageStyle));
  var anchor = imageStyle.getAnchor();
  goog.asserts.assert(!goog.isNull(anchor));
  var size = imageStyle.getSize();
  goog.asserts.assert(!goog.isNull(size));
  // FIXME pixel ratio
  var hitDetectionImage = imageStyle.getHitDetectionImage(1);
  goog.asserts.assert(!goog.isNull(hitDetectionImage));
  var image = imageStyle.getImage(1);
  goog.asserts.assert(!goog.isNull(image));
  this.anchorX_ = anchor[0];
  this.anchorY_ = anchor[1];
  this.hitDetectionImage_ = hitDetectionImage;
  this.image_ = image;
  this.height_ = size[1];
  this.rotation_ = imageStyle.getRotation();
  this.scale_ = imageStyle.getScale();
  this.snapToPixel_ = imageStyle.getSnapToPixel();
  this.width_ = size[0];
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.canvas.LineStringReplay = function(pixelRatio, tolerance) {

  goog.base(this, pixelRatio, tolerance);

  /**
   * @private
   * @type {{currentStrokeStyle: (string|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineDash: Array.<number>,
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         lastStroke: number,
   *         strokeStyle: (string|undefined),
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
goog.inherits(ol.render.canvas.LineStringReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @private
 * @return {number} end.
 */
ol.render.canvas.LineStringReplay.prototype.drawFlatCoordinates_ =
    function(flatCoordinates, offset, end, stride) {
  var myBegin = this.coordinates.length;
  var myEnd = this.appendFlatCoordinates(
      flatCoordinates, offset, end, stride, false);
  var moveToLineToInstruction =
      [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myBegin, myEnd];
  this.instructions.push(moveToLineToInstruction);
  this.hitDetectionInstructions.push(moveToLineToInstruction);
  return end;
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
  goog.asserts.assert(goog.isDef(strokeStyle));
  goog.asserts.assert(goog.isDef(lineCap));
  goog.asserts.assert(!goog.isNull(lineDash));
  goog.asserts.assert(goog.isDef(lineJoin));
  goog.asserts.assert(goog.isDef(lineWidth));
  goog.asserts.assert(goog.isDef(miterLimit));
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      state.currentLineDash != lineDash ||
      state.currentLineJoin != lineJoin ||
      state.currentLineWidth != lineWidth ||
      state.currentMiterLimit != miterLimit) {
    if (state.lastStroke != this.coordinates.length) {
      this.instructions.push(
          [ol.render.canvas.Instruction.STROKE]);
      state.lastStroke = this.coordinates.length;
    }
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         strokeStyle, lineWidth, lineCap, lineJoin, miterLimit, lineDash],
        [ol.render.canvas.Instruction.BEGIN_PATH]);
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
ol.render.canvas.LineStringReplay.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (!goog.isDef(strokeStyle) || !goog.isDef(lineWidth)) {
    return;
  }
  ol.extent.extend(this.extent_, lineStringGeometry.getExtent());
  this.setStrokeStyle_();
  this.beginGeometry(lineStringGeometry);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.STROKE]);
  this.endGeometry(lineStringGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (!goog.isDef(strokeStyle) || !goog.isDef(lineWidth)) {
    return;
  }
  ol.extent.extend(this.extent_, multiLineStringGeometry.getExtent());
  this.setStrokeStyle_();
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
  this.beginGeometry(multiLineStringGeometry);
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
  this.endGeometry(multiLineStringGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.finish = function() {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  if (state.lastStroke != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
  this.reverseHitDetectionInstructions_();
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(goog.isNull(fillStyle));
  goog.asserts.assert(!goog.isNull(strokeStyle));
  var strokeStyleColor = strokeStyle.getColor();
  this.state_.strokeStyle = ol.color.asString(!goog.isNull(strokeStyleColor) ?
      strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = goog.isDef(strokeStyleLineCap) ?
      strokeStyleLineCap : ol.render.canvas.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = !goog.isNull(strokeStyleLineDash) ?
      strokeStyleLineDash : ol.render.canvas.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = goog.isDef(strokeStyleLineJoin) ?
      strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
  var strokeStyleWidth = strokeStyle.getWidth();
  this.state_.lineWidth = this.pixelRatio * (goog.isDef(strokeStyleWidth) ?
      strokeStyleWidth : ol.render.canvas.defaultLineWidth);
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  this.state_.miterLimit = goog.isDef(strokeStyleMiterLimit) ?
      strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} tolerance Tolerance.
 * @protected
 * @struct
 */
ol.render.canvas.PolygonReplay = function(pixelRatio, tolerance) {

  goog.base(this, pixelRatio, tolerance);

  /**
   * @private
   * @type {{currentFillStyle: (string|undefined),
   *         currentStrokeStyle: (string|undefined),
   *         currentLineCap: (string|undefined),
   *         currentLineDash: Array.<number>,
   *         currentLineJoin: (string|undefined),
   *         currentLineWidth: (number|undefined),
   *         currentMiterLimit: (number|undefined),
   *         fillStyle: (string|undefined),
   *         strokeStyle: (string|undefined),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined)}|null}
   */
  this.state_ = {
    currentFillStyle: undefined,
    currentStrokeStyle: undefined,
    currentLineCap: undefined,
    currentLineDash: null,
    currentLineJoin: undefined,
    currentLineWidth: undefined,
    currentMiterLimit: undefined,
    fillStyle: undefined,
    strokeStyle: undefined,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined
  };

};
goog.inherits(ol.render.canvas.PolygonReplay, ol.render.canvas.Replay);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @private
 * @return {number} End.
 */
ol.render.canvas.PolygonReplay.prototype.drawFlatCoordinatess_ =
    function(flatCoordinates, offset, ends, stride) {
  var state = this.state_;
  var beginPathInstruction = [ol.render.canvas.Instruction.BEGIN_PATH];
  this.instructions.push(beginPathInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction);
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var myBegin = this.coordinates.length;
    var myEnd = this.appendFlatCoordinates(
        flatCoordinates, offset, end, stride, true);
    var moveToLineToInstruction =
        [ol.render.canvas.Instruction.MOVE_TO_LINE_TO, myBegin, myEnd];
    var closePathInstruction = [ol.render.canvas.Instruction.CLOSE_PATH];
    this.instructions.push(moveToLineToInstruction, closePathInstruction);
    this.hitDetectionInstructions.push(moveToLineToInstruction,
        closePathInstruction);
    offset = end;
  }
  // FIXME is it quicker to fill and stroke each polygon individually,
  // FIXME or all polygons together?
  var fillInstruction = [ol.render.canvas.Instruction.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (goog.isDef(state.fillStyle)) {
    this.instructions.push(fillInstruction);
  }
  if (goog.isDef(state.strokeStyle)) {
    goog.asserts.assert(goog.isDef(state.lineWidth));
    var strokeInstruction = [ol.render.canvas.Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (!goog.isDef(fillStyle) && !goog.isDef(strokeStyle)) {
    return;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(state.lineWidth));
  }
  ol.extent.extend(this.extent_, polygonGeometry.getExtent());
  this.setFillStrokeStyles_();
  this.beginGeometry(polygonGeometry);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_FILL_STYLE,
       ol.color.asString(ol.render.canvas.defaultFillStyle)]);
  if (goog.isDef(state.strokeStyle)) {
    this.hitDetectionInstructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
         state.miterLimit, state.lineDash]);
  }
  var ends = polygonGeometry.getEnds();
  var flatCoordinates = polygonGeometry.getFlatCoordinates();
  var stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
  this.endGeometry(polygonGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (!goog.isDef(fillStyle) && !goog.isDef(strokeStyle)) {
    return;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(state.lineWidth));
  }
  ol.extent.extend(this.extent_, multiPolygonGeometry.getExtent());
  this.setFillStrokeStyles_();
  this.beginGeometry(multiPolygonGeometry);
  // always fill the multi-polygon for hit detection
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_FILL_STYLE,
       ol.color.asString(ol.render.canvas.defaultFillStyle)]);
  if (goog.isDef(state.strokeStyle)) {
    this.hitDetectionInstructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
         state.miterLimit, state.lineDash]);
  }
  var endss = multiPolygonGeometry.getEndss();
  var flatCoordinates = multiPolygonGeometry.getFlatCoordinates();
  var stride = multiPolygonGeometry.getStride();
  var offset = 0;
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = this.drawFlatCoordinatess_(
        flatCoordinates, offset, endss[i], stride);
  }
  this.endGeometry(multiPolygonGeometry, data);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.reverseHitDetectionInstructions_();
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
      coordinates[i] = ol.geom.simplify.snap(coordinates[i], tolerance);
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(!goog.isNull(fillStyle) || !goog.isNull(strokeStyle));
  var state = this.state_;
  if (!goog.isNull(fillStyle)) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = ol.color.asString(!goog.isNull(fillStyleColor) ?
        fillStyleColor : ol.render.canvas.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (!goog.isNull(strokeStyle)) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = ol.color.asString(!goog.isNull(strokeStyleColor) ?
        strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = goog.isDef(strokeStyleLineCap) ?
        strokeStyleLineCap : ol.render.canvas.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = !goog.isNull(strokeStyleLineDash) ?
        strokeStyleLineDash : ol.render.canvas.defaultLineDash;
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = goog.isDef(strokeStyleLineJoin) ?
        strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
    var strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = this.pixelRatio * (goog.isDef(strokeStyleWidth) ?
        strokeStyleWidth : ol.render.canvas.defaultLineWidth);
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = goog.isDef(strokeStyleMiterLimit) ?
        strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;
  } else {
    state.strokeStyle = undefined;
    state.lineCap = undefined;
    state.lineDash = null;
    state.lineJoin = undefined;
    state.lineWidth = undefined;
    state.miterLimit = undefined;
  }
};


/**
 * @private
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyles_ = function() {
  var state = this.state_;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (goog.isDef(fillStyle) && state.currentFillStyle != fillStyle) {
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_FILL_STYLE, fillStyle]);
    state.currentFillStyle = state.fillStyle;
  }
  if (goog.isDef(strokeStyle)) {
    goog.asserts.assert(goog.isDef(lineCap));
    goog.asserts.assert(!goog.isNull(lineDash));
    goog.asserts.assert(goog.isDef(lineJoin));
    goog.asserts.assert(goog.isDef(lineWidth));
    goog.asserts.assert(goog.isDef(miterLimit));
    if (state.currentStrokeStyle != strokeStyle ||
        state.currentLineCap != lineCap ||
        state.currentLineDash != lineDash ||
        state.currentLineJoin != lineJoin ||
        state.currentLineWidth != lineWidth ||
        state.currentMiterLimit != miterLimit) {
      this.instructions.push(
          [ol.render.canvas.Instruction.SET_STROKE_STYLE,
           strokeStyle, lineWidth, lineCap, lineJoin, miterLimit, lineDash]);
      state.currentStrokeStyle = strokeStyle;
      state.currentLineCap = lineCap;
      state.currentLineDash = lineDash;
      state.currentLineJoin = lineJoin;
      state.currentLineWidth = lineWidth;
      state.currentMiterLimit = miterLimit;
    }
  }
};



/**
 * @constructor
 * @implements {ol.render.IReplayGroup}
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} tolerance Tolerance.
 * @struct
 */
ol.render.canvas.ReplayGroup = function(pixelRatio, tolerance) {

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = pixelRatio;

  /**
   * @private
   * @type {number}
   */
  this.tolerance_ = tolerance;

  /**
   * @private
   * @type {Object.<string,
   *        Object.<ol.render.ReplayType, ol.render.canvas.Replay>>}
   */
  this.replayesByZIndex_ = {};

  /**
   * @type {HTMLCanvasElement}
   */
  var hitDetectionCanvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  hitDetectionCanvas.width = 1;
  hitDetectionCanvas.height = 1;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitDetectionContext_ = /** @type {CanvasRenderingContext2D} */
      (hitDetectionCanvas.getContext('2d'));

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.hitDetectionTransform_ = goog.vec.Mat4.createNumber();

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.replay = function(context, extent,
    transform, renderGeometryFunction) {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.replayesByZIndex_), Number);
  goog.array.sort(zs);
  return this.replay_(
      zs, context, extent, transform, renderGeometryFunction);
};


/**
 * @private
 * @param {Array.<number>} zs Z-indices array.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @param {function(ol.geom.Geometry, Object): T} geometryCallback Geometry
 *     callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.replayHitDetection_ =
    function(zs, context, extent, transform, renderGeometryFunction,
        geometryCallback) {
  var i, ii, replayes, replayType, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replayes = this.replayesByZIndex_[zs[i].toString()];
    for (replayType in replayes) {
      replay = replayes[replayType];
      if (ol.extent.intersects(extent, replay.getExtent())) {
        result = replay.replayHitDetection(
            context, transform, renderGeometryFunction, geometryCallback);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
};


/**
 * @private
 * @param {Array.<number>} zs Z-indices array.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.replay_ =
    function(zs, context, extent, transform, renderGeometryFunction) {
  var i, ii, replayes, replayType, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replayes = this.replayesByZIndex_[zs[i].toString()];
    for (replayType in replayes) {
      replay = replayes[replayType];
      if (ol.extent.intersects(extent, replay.getExtent())) {
        result = replay.replay(
            context, transform, renderGeometryFunction);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(ol.geom.Geometry): boolean} renderGeometryFunction Render
 *     geometry function.
 * @param {function(ol.geom.Geometry, Object): T} callback Geometry callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.forEachGeometryAtCoordinate = function(
    extent, resolution, rotation, coordinate,
    renderGeometryFunction, callback) {

  var transform = this.hitDetectionTransform_;
  ol.vec.Mat4.makeTransform2D(transform, 0.5, 0.5,
      1 / resolution, -1 / resolution, -rotation,
      -coordinate[0], -coordinate[1]);

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.replayesByZIndex_), Number);
  goog.array.sort(zs, function(a, b) { return b - a; });

  var context = this.hitDetectionContext_;
  context.clearRect(0, 0, 1, 1);

  return this.replayHitDetection_(zs, context, extent, transform,
      renderGeometryFunction,
      /**
       * @param {ol.geom.Geometry} geometry Geometry.
       * @param {Object} data Opaque data object.
       * @return {?} Callback result.
       */
      function(geometry, data) {
        var imageData = context.getImageData(0, 0, 1, 1).data;
        if (imageData[3] > 0) {
          var result = callback(geometry, data);
          if (result) {
            return result;
          }
          context.clearRect(0, 0, 1, 1);
        }
      });
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.finish = function() {
  var zKey;
  for (zKey in this.replayesByZIndex_) {
    var replayes = this.replayesByZIndex_[zKey];
    var replayKey;
    for (replayKey in replayes) {
      replayes[replayKey].finish();
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.getReplay =
    function(zIndex, replayType) {
  var zIndexKey = goog.isDef(zIndex) ? zIndex.toString() : '0';
  var replayes = this.replayesByZIndex_[zIndexKey];
  if (!goog.isDef(replayes)) {
    replayes = {};
    this.replayesByZIndex_[zIndexKey] = replayes;
  }
  var replay = replayes[replayType];
  if (!goog.isDef(replay)) {
    var constructor = ol.render.canvas.BATCH_CONSTRUCTORS_[replayType];
    goog.asserts.assert(goog.isDef(constructor));
    replay = new constructor(this.pixelRatio_, this.tolerance_);
    replayes[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.replayesByZIndex_);
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.canvas.Replay, number, number)>}
 */
ol.render.canvas.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay
};
