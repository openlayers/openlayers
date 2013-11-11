// FIXME decide default snapToPixel behaviour
// FIXME add option to apply snapToPixel to all coordinates?

goog.provide('ol.render.canvas.ReplayGroup');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.render');
goog.require('ol.render.IRender');
goog.require('ol.render.IReplayReplayGroup');
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
ol.render.canvas.Replay = function() {

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
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.Replay.prototype.draw = function(context, transform) {
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
ol.render.canvas.Replay.prototype.drawFeature = goog.abstractMethod;


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
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.ImageReplay = function() {

  goog.base(this);

  /**
   * @private
   * @type {?ol.style.Image}
   */
  this.imageStyle_ = null;

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
ol.render.canvas.ImageReplay.prototype.drawMultiPointGeometry =
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
ol.render.canvas.ImageReplay.prototype.finish = function() {
  // FIXME this doesn't really protect us against further calls to draw*Geometry
  this.imageStyle_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  this.imageStyle_ = imageStyle;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.LineStringReplay = function() {

  goog.base(this);

  /**
   * @private
   * @type {{currentStrokeStyle: ?ol.style.Stroke,
   *         lastStroke: number,
   *         strokeStyle: ?ol.style.Stroke}|null}
   */
  this.state_ = {
    currentStrokeStyle: null,
    lastStroke: 0,
    strokeStyle: null
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
  var state = this.state_;
  if (!ol.style.stroke.equals(state.currentStrokeStyle, state.strokeStyle)) {
    if (state.lastStroke != this.coordinates.length) {
      this.instructions.push([ol.render.canvas.Instruction.STROKE]);
      state.lastStroke = this.coordinates.length;
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
ol.render.canvas.LineStringReplay.prototype.drawLineStringGeometry =
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
ol.render.canvas.LineStringReplay.prototype.drawMultiLineStringGeometry =
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
ol.render.canvas.LineStringReplay.prototype.finish = function() {
  var state = this.state_;
  goog.asserts.assert(!goog.isNull(state));
  if (state.lastStroke != this.coordinates.length) {
    this.instructions.push([ol.render.canvas.Instruction.STROKE]);
  }
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
  this.state_.strokeStyle = strokeStyle;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @protected
 */
ol.render.canvas.PolygonReplay = function() {

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
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawPolygonGeometry =
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
ol.render.canvas.PolygonReplay.prototype.drawMultiPolygonGeometry =
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
    offset = this.drawFlatCoordinatess_(
        flatCoordinates, offset, endss[i], stride);
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.finish = function() {
  goog.asserts.assert(!goog.isNull(this.state_));
  this.state_ = null;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(!goog.isNull(this.state_));
  goog.asserts.assert(!goog.isNull(fillStyle) || !goog.isNull(strokeStyle));
  this.state_.fillStyle = fillStyle;
  this.state_.strokeStyle = strokeStyle;
};


/**
 * @private
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyles_ = function() {
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
 * @implements {ol.render.IReplayReplayGroup}
 */
ol.render.canvas.ReplayGroup = function() {

  /**
   * @private
   * @type {Object.<string,
   *        Object.<ol.render.ReplayType, ol.render.canvas.Replay>>}
   */
  this.replayesByZIndex_ = {};

};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Extent} extent Extent.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.render.canvas.ReplayGroup.prototype.draw =
    function(context, extent, transform) {
  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(this.replayesByZIndex_), Number);
  goog.array.sort(zs);
  var i, ii;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    var replayes = this.replayesByZIndex_[zs[i].toString()];
    var replayType;
    for (replayType in replayes) {
      var replay = replayes[replayType];
      if (ol.extent.intersects(extent, replay.getExtent())) {
        replay.draw(context, transform);
      }
    }
  }
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
    replay = new constructor();
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
 * @type {Object.<ol.render.ReplayType, function(new: ol.render.canvas.Replay)>}
 */
ol.render.canvas.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay
};
