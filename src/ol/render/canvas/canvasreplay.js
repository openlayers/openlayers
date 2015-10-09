// FIXME add option to apply snapToPixel to all coordinates?
// FIXME can eliminate empty set styles and strokes (when all geoms skipped)

goog.provide('ol.render.canvas.ImageReplay');
goog.provide('ol.render.canvas.LineStringReplay');
goog.provide('ol.render.canvas.PolygonReplay');
goog.provide('ol.render.canvas.Replay');
goog.provide('ol.render.canvas.ReplayGroup');
goog.provide('ol.render.canvas.TextReplay');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.extent.Relationship');
goog.require('ol.geom.flat.simplify');
goog.require('ol.geom.flat.transform');
goog.require('ol.has');
goog.require('ol.render.IReplayGroup');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas');
goog.require('ol.vec.Mat4');


/**
 * @enum {number}
 */
ol.render.canvas.Instruction = {
  BEGIN_GEOMETRY: 0,
  BEGIN_PATH: 1,
  CIRCLE: 2,
  CLOSE_PATH: 3,
  DRAW_IMAGE: 4,
  DRAW_TEXT: 5,
  END_GEOMETRY: 6,
  FILL: 7,
  MOVE_TO_LINE_TO: 8,
  SET_FILL_STYLE: 9,
  SET_STROKE_STYLE: 10,
  SET_TEXT_STYLE: 11,
  STROKE: 12
};



/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @protected
 * @struct
 */
ol.render.canvas.Replay = function(tolerance, maxExtent, resolution) {
  goog.base(this);

  /**
   * @protected
   * @type {number}
   */
  this.tolerance = tolerance;

  /**
   * @protected
   * @const
   * @type {ol.Extent}
   */
  this.maxExtent = maxExtent;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.bufferedMaxExtent_ = null;

  /**
   * @protected
   * @type {number}
   */
  this.maxLineWidth = 0;

  /**
   * @protected
   * @const
   * @type {number}
   */
  this.resolution = resolution;

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
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpLocalTransform_ = goog.vec.Mat4.createNumber();
};
goog.inherits(ol.render.canvas.Replay, ol.render.VectorContext);


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
  var extent = this.getBufferedMaxExtent();
  var lastCoord = [flatCoordinates[offset], flatCoordinates[offset + 1]];
  var nextCoord = [NaN, NaN];
  var skipped = true;

  var i, lastRel, nextRel;
  for (i = offset + stride; i < end; i += stride) {
    nextCoord[0] = flatCoordinates[i];
    nextCoord[1] = flatCoordinates[i + 1];
    nextRel = ol.extent.coordinateRelationship(extent, nextCoord);
    if (nextRel !== lastRel) {
      if (skipped) {
        this.coordinates[myEnd++] = lastCoord[0];
        this.coordinates[myEnd++] = lastCoord[1];
      }
      this.coordinates[myEnd++] = nextCoord[0];
      this.coordinates[myEnd++] = nextCoord[1];
      skipped = false;
    } else if (nextRel === ol.extent.Relationship.INTERSECTING) {
      this.coordinates[myEnd++] = nextCoord[0];
      this.coordinates[myEnd++] = nextCoord[1];
      skipped = false;
    } else {
      skipped = true;
    }
    lastCoord[0] = nextCoord[0];
    lastCoord[1] = nextCoord[1];
    lastRel = nextRel;
  }

  // handle case where there is only one point to append
  if (i === offset + stride) {
    this.coordinates[myEnd++] = lastCoord[0];
    this.coordinates[myEnd++] = lastCoord[1];
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
 * @param {ol.Feature} feature Feature.
 */
ol.render.canvas.Replay.prototype.beginGeometry = function(geometry, feature) {
  this.beginGeometryInstruction1_ =
      [ol.render.canvas.Instruction.BEGIN_GEOMETRY, feature, 0];
  this.instructions.push(this.beginGeometryInstruction1_);
  this.beginGeometryInstruction2_ =
      [ol.render.canvas.Instruction.BEGIN_GEOMETRY, feature, 0];
  this.hitDetectionInstructions.push(this.beginGeometryInstruction2_);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<*>} instructions Instructions array.
 * @param {function(ol.Feature): T|undefined} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.Replay.prototype.replay_ = function(
    context, pixelRatio, transform, viewRotation, skippedFeaturesHash,
    instructions, featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (ol.vec.Mat4.equals2D(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    pixelCoordinates = ol.geom.flat.transform.transform2D(
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
    goog.vec.Mat4.setFromArray(this.renderedTransform_, transform);
    goog.asserts.assert(pixelCoordinates === this.pixelCoordinates_,
        'pixelCoordinates should be the same as this.pixelCoordinates_');
  }
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d = 0; // data index
  var dd; // end of per-instruction data
  var localTransform = this.tmpLocalTransform_;
  while (i < ii) {
    var instruction = instructions[i];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    var feature, fill, stroke, text, x, y;
    switch (type) {
      case ol.render.canvas.Instruction.BEGIN_GEOMETRY:
        feature = /** @type {ol.Feature} */ (instruction[1]);
        var featureUid = goog.getUid(feature).toString();
        if (skippedFeaturesHash[featureUid] !== undefined ||
            !feature.getGeometry()) {
          i = /** @type {number} */ (instruction[2]);
        } else if (opt_hitExtent !== undefined && !ol.extent.intersects(
            /** @type {Array<number>} */ (opt_hitExtent),
            feature.getGeometry().getExtent())) {
          i = /** @type {number} */ (instruction[2]);
        } else {
          ++i;
        }
        break;
      case ol.render.canvas.Instruction.BEGIN_PATH:
        context.beginPath();
        ++i;
        break;
      case ol.render.canvas.Instruction.CIRCLE:
        goog.asserts.assert(goog.isNumber(instruction[1]),
            'second instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        var x1 = pixelCoordinates[d];
        var y1 = pixelCoordinates[d + 1];
        var x2 = pixelCoordinates[d + 2];
        var y2 = pixelCoordinates[d + 3];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var r = Math.sqrt(dx * dx + dy * dy);
        context.arc(x1, y1, r, 0, 2 * Math.PI, true);
        ++i;
        break;
      case ol.render.canvas.Instruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_IMAGE:
        goog.asserts.assert(goog.isNumber(instruction[1]),
            'second instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        goog.asserts.assert(goog.isNumber(instruction[2]),
            'third instruction should be a number');
        dd = /** @type {number} */ (instruction[2]);
        var image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
            (instruction[3]);
        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        var anchorX = /** @type {number} */ (instruction[4]) * pixelRatio;
        var anchorY = /** @type {number} */ (instruction[5]) * pixelRatio;
        var height = /** @type {number} */ (instruction[6]);
        var opacity = /** @type {number} */ (instruction[7]);
        var originX = /** @type {number} */ (instruction[8]);
        var originY = /** @type {number} */ (instruction[9]);
        var rotateWithView = /** @type {boolean} */ (instruction[10]);
        var rotation = /** @type {number} */ (instruction[11]);
        var scale = /** @type {number} */ (instruction[12]);
        var snapToPixel = /** @type {boolean} */ (instruction[13]);
        var width = /** @type {number} */ (instruction[14]);
        if (rotateWithView) {
          rotation += viewRotation;
        }
        for (; d < dd; d += 2) {
          x = pixelCoordinates[d] - anchorX;
          y = pixelCoordinates[d + 1] - anchorY;
          if (snapToPixel) {
            x = (x + 0.5) | 0;
            y = (y + 0.5) | 0;
          }
          if (scale != 1 || rotation !== 0) {
            var centerX = x + anchorX;
            var centerY = y + anchorY;
            ol.vec.Mat4.makeTransform2D(
                localTransform, centerX, centerY, scale, scale,
                rotation, -centerX, -centerY);
            context.setTransform(
                goog.vec.Mat4.getElement(localTransform, 0, 0),
                goog.vec.Mat4.getElement(localTransform, 1, 0),
                goog.vec.Mat4.getElement(localTransform, 0, 1),
                goog.vec.Mat4.getElement(localTransform, 1, 1),
                goog.vec.Mat4.getElement(localTransform, 0, 3),
                goog.vec.Mat4.getElement(localTransform, 1, 3));
          }
          var alpha = context.globalAlpha;
          if (opacity != 1) {
            context.globalAlpha = alpha * opacity;
          }

          context.drawImage(image, originX, originY, width, height,
              x, y, width * pixelRatio, height * pixelRatio);

          if (opacity != 1) {
            context.globalAlpha = alpha;
          }
          if (scale != 1 || rotation !== 0) {
            context.setTransform(1, 0, 0, 1, 0, 0);
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_TEXT:
        goog.asserts.assert(goog.isNumber(instruction[1]),
            '2nd instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        goog.asserts.assert(goog.isNumber(instruction[2]),
            '3rd instruction should be a number');
        dd = /** @type {number} */ (instruction[2]);
        goog.asserts.assert(goog.isString(instruction[3]),
            '4th instruction should be a string');
        text = /** @type {string} */ (instruction[3]);
        goog.asserts.assert(goog.isNumber(instruction[4]),
            '5th instruction should be a number');
        var offsetX = /** @type {number} */ (instruction[4]) * pixelRatio;
        goog.asserts.assert(goog.isNumber(instruction[5]),
            '6th instruction should be a number');
        var offsetY = /** @type {number} */ (instruction[5]) * pixelRatio;
        goog.asserts.assert(goog.isNumber(instruction[6]),
            '7th instruction should be a number');
        rotation = /** @type {number} */ (instruction[6]);
        goog.asserts.assert(goog.isNumber(instruction[7]),
            '8th instruction should be a number');
        scale = /** @type {number} */ (instruction[7]) * pixelRatio;
        goog.asserts.assert(goog.isBoolean(instruction[8]),
            '9th instruction should be a boolean');
        fill = /** @type {boolean} */ (instruction[8]);
        goog.asserts.assert(goog.isBoolean(instruction[9]),
            '10th instruction should be a boolean');
        stroke = /** @type {boolean} */ (instruction[9]);
        for (; d < dd; d += 2) {
          x = pixelCoordinates[d] + offsetX;
          y = pixelCoordinates[d + 1] + offsetY;
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
          if (stroke) {
            context.strokeText(text, x, y);
          }
          if (fill) {
            context.fillText(text, x, y);
          }
          if (scale != 1 || rotation !== 0) {
            context.setTransform(1, 0, 0, 1, 0, 0);
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {ol.Feature} */ (instruction[1]);
          var result = featureCallback(feature);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.FILL:
        context.fill();
        ++i;
        break;
      case ol.render.canvas.Instruction.MOVE_TO_LINE_TO:
        goog.asserts.assert(goog.isNumber(instruction[1]),
            '2nd instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        goog.asserts.assert(goog.isNumber(instruction[2]),
            '3rd instruction should be a number');
        dd = /** @type {number} */ (instruction[2]);
        context.moveTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
        for (d += 2; d < dd; d += 2) {
          context.lineTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_FILL_STYLE:
        goog.asserts.assert(goog.isString(instruction[1]),
            '2nd instruction should be a string');
        context.fillStyle = /** @type {string} */ (instruction[1]);
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_STROKE_STYLE:
        goog.asserts.assert(goog.isString(instruction[1]),
            '2nd instruction should be a string');
        goog.asserts.assert(goog.isNumber(instruction[2]),
            '3rd instruction should be a number');
        goog.asserts.assert(goog.isString(instruction[3]),
            '4rd instruction should be a string');
        goog.asserts.assert(goog.isString(instruction[4]),
            '5th instruction should be a string');
        goog.asserts.assert(goog.isNumber(instruction[5]),
            '6th instruction should be a number');
        goog.asserts.assert(instruction[6],
            '7th instruction should not be null');
        var usePixelRatio = instruction[7] !== undefined ?
            instruction[7] : true;
        var lineWidth = /** @type {number} */ (instruction[2]);
        context.strokeStyle = /** @type {string} */ (instruction[1]);
        context.lineWidth = usePixelRatio ? lineWidth * pixelRatio : lineWidth;
        context.lineCap = /** @type {string} */ (instruction[3]);
        context.lineJoin = /** @type {string} */ (instruction[4]);
        context.miterLimit = /** @type {number} */ (instruction[5]);
        if (ol.has.CANVAS_LINE_DASH) {
          context.setLineDash(/** @type {Array.<number>} */ (instruction[6]));
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_TEXT_STYLE:
        goog.asserts.assert(goog.isString(instruction[1]),
            '2nd instruction should be a string');
        goog.asserts.assert(goog.isString(instruction[2]),
            '3rd instruction should be a string');
        goog.asserts.assert(goog.isString(instruction[3]),
            '4th instruction should be a string');
        context.font = /** @type {string} */ (instruction[1]);
        context.textAlign = /** @type {string} */ (instruction[2]);
        context.textBaseline = /** @type {string} */ (instruction[3]);
        ++i;
        break;
      case ol.render.canvas.Instruction.STROKE:
        context.stroke();
        ++i;
        break;
      default:
        goog.asserts.fail('Unknown canvas render instruction');
        ++i; // consume the instruction anyway, to avoid an infinite loop
        break;
    }
  }
  // assert that all instructions were consumed
  goog.asserts.assert(i == instructions.length,
      'all instructions should be consumed');
  return undefined;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 */
ol.render.canvas.Replay.prototype.replay = function(
    context, pixelRatio, transform, viewRotation, skippedFeaturesHash) {
  var instructions = this.instructions;
  this.replay_(context, pixelRatio, transform, viewRotation,
      skippedFeaturesHash, instructions, undefined);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function(ol.Feature): T=} opt_featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.Replay.prototype.replayHitDetection = function(
    context, transform, viewRotation, skippedFeaturesHash,
    opt_featureCallback, opt_hitExtent) {
  var instructions = this.hitDetectionInstructions;
  return this.replay_(context, 1, transform, viewRotation,
      skippedFeaturesHash, instructions, opt_featureCallback, opt_hitExtent);
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
      goog.asserts.assert(begin == -1, 'begin should be -1');
      begin = i;
    } else if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      instruction[2] = i;
      goog.asserts.assert(begin >= 0,
          'begin should be larger than or equal to 0');
      ol.array.reverseSubArray(this.hitDetectionInstructions, begin, i);
      begin = -1;
    }
  }
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {ol.Feature} feature Feature.
 */
ol.render.canvas.Replay.prototype.endGeometry = function(geometry, feature) {
  goog.asserts.assert(this.beginGeometryInstruction1_,
      'this.beginGeometryInstruction1_ should not be null');
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
  goog.asserts.assert(this.beginGeometryInstruction2_,
      'this.beginGeometryInstruction2_ should not be null');
  this.beginGeometryInstruction2_[2] = this.hitDetectionInstructions.length;
  this.beginGeometryInstruction2_ = null;
  var endGeometryInstruction =
      [ol.render.canvas.Instruction.END_GEOMETRY, feature];
  this.instructions.push(endGeometryInstruction);
  this.hitDetectionInstructions.push(endGeometryInstruction);
};


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.Replay.prototype.finish = ol.nullFunction;


/**
 * Get the buffered rendering extent.  Rendering will be clipped to the extent
 * provided to the constructor.  To account for symbolizers that may intersect
 * this extent, we calculate a buffered extent (e.g. based on stroke width).
 * @return {ol.Extent} The buffered rendering extent.
 * @protected
 */
ol.render.canvas.Replay.prototype.getBufferedMaxExtent = function() {
  return this.maxExtent;
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @protected
 * @struct
 */
ol.render.canvas.ImageReplay = function(tolerance, maxExtent, resolution) {
  goog.base(this, tolerance, maxExtent, resolution);

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
  this.opacity_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.originX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.originY_ = undefined;

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.rotateWithView_ = undefined;

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
    function(pointGeometry, feature) {
  if (!this.image_) {
    return;
  }
  goog.asserts.assert(this.anchorX_ !== undefined,
      'this.anchorX_ should be defined');
  goog.asserts.assert(this.anchorY_ !== undefined,
      'this.anchorY_ should be defined');
  goog.asserts.assert(this.height_ !== undefined,
      'this.height_ should be defined');
  goog.asserts.assert(this.opacity_ !== undefined,
      'this.opacity_ should be defined');
  goog.asserts.assert(this.originX_ !== undefined,
      'this.originX_ should be defined');
  goog.asserts.assert(this.originY_ !== undefined,
      'this.originY_ should be defined');
  goog.asserts.assert(this.rotateWithView_ !== undefined,
      'this.rotateWithView_ should be defined');
  goog.asserts.assert(this.rotation_ !== undefined,
      'this.rotation_ should be defined');
  goog.asserts.assert(this.scale_ !== undefined,
      'this.scale_ should be defined');
  goog.asserts.assert(this.width_ !== undefined,
      'this.width_ should be defined');
  this.beginGeometry(pointGeometry, feature);
  var flatCoordinates = pointGeometry.getFlatCoordinates();
  var stride = pointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.endGeometry(pointGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, feature) {
  if (!this.image_) {
    return;
  }
  goog.asserts.assert(this.anchorX_ !== undefined,
      'this.anchorX_ should be defined');
  goog.asserts.assert(this.anchorY_ !== undefined,
      'this.anchorY_ should be defined');
  goog.asserts.assert(this.height_ !== undefined,
      'this.height_ should be defined');
  goog.asserts.assert(this.opacity_ !== undefined,
      'this.opacity_ should be defined');
  goog.asserts.assert(this.originX_ !== undefined,
      'this.originX_ should be defined');
  goog.asserts.assert(this.originY_ !== undefined,
      'this.originY_ should be defined');
  goog.asserts.assert(this.rotateWithView_ !== undefined,
      'this.rotateWithView_ should be defined');
  goog.asserts.assert(this.rotation_ !== undefined,
      'this.rotation_ should be defined');
  goog.asserts.assert(this.scale_ !== undefined,
      'this.scale_ should be defined');
  goog.asserts.assert(this.width_ !== undefined,
      'this.width_ should be defined');
  this.beginGeometry(multiPointGeometry, feature);
  var flatCoordinates = multiPointGeometry.getFlatCoordinates();
  var stride = multiPointGeometry.getStride();
  var myBegin = this.coordinates.length;
  var myEnd = this.drawCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.instructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd, this.image_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.hitDetectionInstructions.push([
    ol.render.canvas.Instruction.DRAW_IMAGE, myBegin, myEnd,
    this.hitDetectionImage_,
    // Remaining arguments to DRAW_IMAGE are in alphabetical order
    this.anchorX_, this.anchorY_, this.height_, this.opacity_,
    this.originX_, this.originY_, this.rotateWithView_, this.rotation_,
    this.scale_, this.snapToPixel_, this.width_
  ]);
  this.endGeometry(multiPointGeometry, feature);
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
  this.opacity_ = undefined;
  this.originX_ = undefined;
  this.originY_ = undefined;
  this.rotateWithView_ = undefined;
  this.rotation_ = undefined;
  this.snapToPixel_ = undefined;
  this.width_ = undefined;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle) {
  goog.asserts.assert(imageStyle, 'imageStyle should not be null');
  var anchor = imageStyle.getAnchor();
  goog.asserts.assert(anchor, 'anchor should not be null');
  var size = imageStyle.getSize();
  goog.asserts.assert(size, 'size should not be null');
  var hitDetectionImage = imageStyle.getHitDetectionImage(1);
  goog.asserts.assert(hitDetectionImage,
      'hitDetectionImage should not be null');
  var image = imageStyle.getImage(1);
  goog.asserts.assert(image, 'image should not be null');
  var origin = imageStyle.getOrigin();
  goog.asserts.assert(origin, 'origin should not be null');
  this.anchorX_ = anchor[0];
  this.anchorY_ = anchor[1];
  this.hitDetectionImage_ = hitDetectionImage;
  this.image_ = image;
  this.height_ = size[1];
  this.opacity_ = imageStyle.getOpacity();
  this.originX_ = origin[0];
  this.originY_ = origin[1];
  this.rotateWithView_ = imageStyle.getRotateWithView();
  this.rotation_ = imageStyle.getRotation();
  this.scale_ = imageStyle.getScale();
  this.snapToPixel_ = imageStyle.getSnapToPixel();
  this.width_ = size[0];
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @protected
 * @struct
 */
ol.render.canvas.LineStringReplay = function(tolerance, maxExtent, resolution) {

  goog.base(this, tolerance, maxExtent, resolution);

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
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = ol.extent.clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      ol.extent.buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
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
  goog.asserts.assert(strokeStyle !== undefined,
      'strokeStyle should be defined');
  goog.asserts.assert(lineCap !== undefined, 'lineCap should be defined');
  goog.asserts.assert(lineDash, 'lineDash should not be null');
  goog.asserts.assert(lineJoin !== undefined, 'lineJoin should be defined');
  goog.asserts.assert(lineWidth !== undefined, 'lineWidth should be defined');
  goog.asserts.assert(miterLimit !== undefined, 'miterLimit should be defined');
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      !goog.array.equals(state.currentLineDash, lineDash) ||
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
    function(lineStringGeometry, feature) {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
  this.beginGeometry(lineStringGeometry, feature);
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_STROKE_STYLE,
       state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
       state.miterLimit, state.lineDash],
      [ol.render.canvas.Instruction.BEGIN_PATH]);
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  this.drawFlatCoordinates_(
      flatCoordinates, 0, flatCoordinates.length, stride);
  this.hitDetectionInstructions.push([ol.render.canvas.Instruction.STROKE]);
  this.endGeometry(lineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, feature) {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
  var strokeStyle = state.strokeStyle;
  var lineWidth = state.lineWidth;
  if (strokeStyle === undefined || lineWidth === undefined) {
    return;
  }
  this.setStrokeStyle_();
  this.beginGeometry(multiLineStringGeometry, feature);
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_STROKE_STYLE,
       state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
       state.miterLimit, state.lineDash],
      [ol.render.canvas.Instruction.BEGIN_PATH]);
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
  this.endGeometry(multiLineStringGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.LineStringReplay.prototype.finish = function() {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
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
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
  goog.asserts.assert(!fillStyle, 'fillStyle should be null');
  goog.asserts.assert(strokeStyle, 'strokeStyle should not be null');
  var strokeStyleColor = strokeStyle.getColor();
  this.state_.strokeStyle = ol.color.asString(strokeStyleColor ?
      strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.canvas.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.canvas.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
  var strokeStyleWidth = strokeStyle.getWidth();
  this.state_.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.canvas.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  this.state_.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;

  if (this.state_.lineWidth > this.maxLineWidth) {
    this.maxLineWidth = this.state_.lineWidth;
    // invalidate the buffered max extent cache
    this.bufferedMaxExtent_ = null;
  }
};



/**
 * @constructor
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @protected
 * @struct
 */
ol.render.canvas.PolygonReplay = function(tolerance, maxExtent, resolution) {

  goog.base(this, tolerance, maxExtent, resolution);

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
  if (state.fillStyle !== undefined) {
    this.instructions.push(fillInstruction);
  }
  if (state.strokeStyle !== undefined) {
    goog.asserts.assert(state.lineWidth !== undefined,
        'state.lineWidth should be defined');
    var strokeInstruction = [ol.render.canvas.Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  return offset;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawCircleGeometry =
    function(circleGeometry, feature) {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  if (strokeStyle !== undefined) {
    goog.asserts.assert(state.lineWidth !== undefined,
        'state.lineWidth should be defined');
  }
  this.setFillStrokeStyles_();
  this.beginGeometry(circleGeometry, feature);
  // always fill the circle for hit detection
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_FILL_STYLE,
       ol.color.asString(ol.render.canvas.defaultFillStyle)]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
         state.miterLimit, state.lineDash]);
  }
  var flatCoordinates = circleGeometry.getFlatCoordinates();
  var stride = circleGeometry.getStride();
  var myBegin = this.coordinates.length;
  this.appendFlatCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride, false);
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
    goog.asserts.assert(state.lineWidth !== undefined,
        'state.lineWidth should be defined');
    var strokeInstruction = [ol.render.canvas.Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  this.endGeometry(circleGeometry, feature);
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.drawPolygonGeometry =
    function(polygonGeometry, feature) {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  if (strokeStyle !== undefined) {
    goog.asserts.assert(state.lineWidth !== undefined,
        'state.lineWidth should be defined');
  }
  this.setFillStrokeStyles_();
  this.beginGeometry(polygonGeometry, feature);
  // always fill the polygon for hit detection
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_FILL_STYLE,
       ol.color.asString(ol.render.canvas.defaultFillStyle)]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
         state.miterLimit, state.lineDash]);
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
ol.render.canvas.PolygonReplay.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, feature) {
  var state = this.state_;
  goog.asserts.assert(state, 'state should not be null');
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  if (strokeStyle !== undefined) {
    goog.asserts.assert(state.lineWidth !== undefined,
        'state.lineWidth should be defined');
  }
  this.setFillStrokeStyles_();
  this.beginGeometry(multiPolygonGeometry, feature);
  // always fill the multi-polygon for hit detection
  this.hitDetectionInstructions.push(
      [ol.render.canvas.Instruction.SET_FILL_STYLE,
       ol.color.asString(ol.render.canvas.defaultFillStyle)]);
  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push(
        [ol.render.canvas.Instruction.SET_STROKE_STYLE,
         state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
         state.miterLimit, state.lineDash]);
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
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
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
      coordinates[i] = ol.geom.flat.simplify.snap(coordinates[i], tolerance);
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = ol.extent.clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      ol.extent.buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};


/**
 * @inheritDoc
 */
ol.render.canvas.PolygonReplay.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
  goog.asserts.assert(this.state_, 'this.state_ should not be null');
  goog.asserts.assert(fillStyle || strokeStyle,
      'fillStyle or strokeStyle should not be null');
  var state = this.state_;
  if (fillStyle) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = ol.color.asString(fillStyleColor ?
        fillStyleColor : ol.render.canvas.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (strokeStyle) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = ol.color.asString(strokeStyleColor ?
        strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = strokeStyleLineCap !== undefined ?
        strokeStyleLineCap : ol.render.canvas.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = strokeStyleLineDash ?
        strokeStyleLineDash.slice() : ol.render.canvas.defaultLineDash;
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = strokeStyleLineJoin !== undefined ?
        strokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
    var strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = strokeStyleWidth !== undefined ?
        strokeStyleWidth : ol.render.canvas.defaultLineWidth;
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = strokeStyleMiterLimit !== undefined ?
        strokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;

    if (state.lineWidth > this.maxLineWidth) {
      this.maxLineWidth = state.lineWidth;
      // invalidate the buffered max extent cache
      this.bufferedMaxExtent_ = null;
    }
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
  if (fillStyle !== undefined && state.currentFillStyle != fillStyle) {
    this.instructions.push(
        [ol.render.canvas.Instruction.SET_FILL_STYLE, fillStyle]);
    state.currentFillStyle = state.fillStyle;
  }
  if (strokeStyle !== undefined) {
    goog.asserts.assert(lineCap !== undefined, 'lineCap should be defined');
    goog.asserts.assert(lineDash, 'lineDash should not be null');
    goog.asserts.assert(lineJoin !== undefined, 'lineJoin should be defined');
    goog.asserts.assert(lineWidth !== undefined, 'lineWidth should be defined');
    goog.asserts.assert(miterLimit !== undefined,
        'miterLimit should be defined');
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
 * @extends {ol.render.canvas.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @protected
 * @struct
 */
ol.render.canvas.TextReplay = function(tolerance, maxExtent, resolution) {

  goog.base(this, tolerance, maxExtent, resolution);

  /**
   * @private
   * @type {?ol.render.canvas.FillState}
   */
  this.replayFillState_ = null;

  /**
   * @private
   * @type {?ol.render.canvas.StrokeState}
   */
  this.replayStrokeState_ = null;

  /**
   * @private
   * @type {?ol.render.canvas.TextState}
   */
  this.replayTextState_ = null;

  /**
   * @private
   * @type {string}
   */
  this.text_ = '';

  /**
   * @private
   * @type {number}
   */
  this.textOffsetX_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.textOffsetY_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.textRotation_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.textScale_ = 0;

  /**
   * @private
   * @type {?ol.render.canvas.FillState}
   */
  this.textFillState_ = null;

  /**
   * @private
   * @type {?ol.render.canvas.StrokeState}
   */
  this.textStrokeState_ = null;

  /**
   * @private
   * @type {?ol.render.canvas.TextState}
   */
  this.textState_ = null;

};
goog.inherits(ol.render.canvas.TextReplay, ol.render.canvas.Replay);


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.drawText =
    function(flatCoordinates, offset, end, stride, geometry, feature) {
  if (this.text_ === '' || !this.textState_ ||
      (!this.textFillState_ && !this.textStrokeState_)) {
    return;
  }
  if (this.textFillState_) {
    this.setReplayFillState_(this.textFillState_);
  }
  if (this.textStrokeState_) {
    this.setReplayStrokeState_(this.textStrokeState_);
  }
  this.setReplayTextState_(this.textState_);
  this.beginGeometry(geometry, feature);
  var myBegin = this.coordinates.length;
  var myEnd =
      this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false);
  var fill = !!this.textFillState_;
  var stroke = !!this.textStrokeState_;
  var drawTextInstruction = [
    ol.render.canvas.Instruction.DRAW_TEXT, myBegin, myEnd, this.text_,
    this.textOffsetX_, this.textOffsetY_, this.textRotation_, this.textScale_,
    fill, stroke];
  this.instructions.push(drawTextInstruction);
  this.hitDetectionInstructions.push(drawTextInstruction);
  this.endGeometry(geometry, feature);
};


/**
 * @param {ol.render.canvas.FillState} fillState Fill state.
 * @private
 */
ol.render.canvas.TextReplay.prototype.setReplayFillState_ =
    function(fillState) {
  var replayFillState = this.replayFillState_;
  if (replayFillState &&
      replayFillState.fillStyle == fillState.fillStyle) {
    return;
  }
  var setFillStyleInstruction =
      [ol.render.canvas.Instruction.SET_FILL_STYLE, fillState.fillStyle];
  this.instructions.push(setFillStyleInstruction);
  this.hitDetectionInstructions.push(setFillStyleInstruction);
  if (!replayFillState) {
    this.replayFillState_ = {
      fillStyle: fillState.fillStyle
    };
  } else {
    replayFillState.fillStyle = fillState.fillStyle;
  }
};


/**
 * @param {ol.render.canvas.StrokeState} strokeState Stroke state.
 * @private
 */
ol.render.canvas.TextReplay.prototype.setReplayStrokeState_ =
    function(strokeState) {
  var replayStrokeState = this.replayStrokeState_;
  if (replayStrokeState &&
      replayStrokeState.lineCap == strokeState.lineCap &&
      replayStrokeState.lineDash == strokeState.lineDash &&
      replayStrokeState.lineJoin == strokeState.lineJoin &&
      replayStrokeState.lineWidth == strokeState.lineWidth &&
      replayStrokeState.miterLimit == strokeState.miterLimit &&
      replayStrokeState.strokeStyle == strokeState.strokeStyle) {
    return;
  }
  var setStrokeStyleInstruction = [
    ol.render.canvas.Instruction.SET_STROKE_STYLE, strokeState.strokeStyle,
    strokeState.lineWidth, strokeState.lineCap, strokeState.lineJoin,
    strokeState.miterLimit, strokeState.lineDash, false
  ];
  this.instructions.push(setStrokeStyleInstruction);
  this.hitDetectionInstructions.push(setStrokeStyleInstruction);
  if (!replayStrokeState) {
    this.replayStrokeState_ = {
      lineCap: strokeState.lineCap,
      lineDash: strokeState.lineDash,
      lineJoin: strokeState.lineJoin,
      lineWidth: strokeState.lineWidth,
      miterLimit: strokeState.miterLimit,
      strokeStyle: strokeState.strokeStyle
    };
  } else {
    replayStrokeState.lineCap = strokeState.lineCap;
    replayStrokeState.lineDash = strokeState.lineDash;
    replayStrokeState.lineJoin = strokeState.lineJoin;
    replayStrokeState.lineWidth = strokeState.lineWidth;
    replayStrokeState.miterLimit = strokeState.miterLimit;
    replayStrokeState.strokeStyle = strokeState.strokeStyle;
  }
};


/**
 * @param {ol.render.canvas.TextState} textState Text state.
 * @private
 */
ol.render.canvas.TextReplay.prototype.setReplayTextState_ =
    function(textState) {
  var replayTextState = this.replayTextState_;
  if (replayTextState &&
      replayTextState.font == textState.font &&
      replayTextState.textAlign == textState.textAlign &&
      replayTextState.textBaseline == textState.textBaseline) {
    return;
  }
  var setTextStyleInstruction = [ol.render.canvas.Instruction.SET_TEXT_STYLE,
    textState.font, textState.textAlign, textState.textBaseline];
  this.instructions.push(setTextStyleInstruction);
  this.hitDetectionInstructions.push(setTextStyleInstruction);
  if (!replayTextState) {
    this.replayTextState_ = {
      font: textState.font,
      textAlign: textState.textAlign,
      textBaseline: textState.textBaseline
    };
  } else {
    replayTextState.font = textState.font;
    replayTextState.textAlign = textState.textAlign;
    replayTextState.textBaseline = textState.textBaseline;
  }
};


/**
 * @inheritDoc
 */
ol.render.canvas.TextReplay.prototype.setTextStyle = function(textStyle) {
  if (!textStyle) {
    this.text_ = '';
  } else {
    var textFillStyle = textStyle.getFill();
    if (!textFillStyle) {
      this.textFillState_ = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      var fillStyle = ol.color.asString(textFillStyleColor ?
          textFillStyleColor : ol.render.canvas.defaultFillStyle);
      if (!this.textFillState_) {
        this.textFillState_ = {
          fillStyle: fillStyle
        };
      } else {
        var textFillState = this.textFillState_;
        textFillState.fillStyle = fillStyle;
      }
    }
    var textStrokeStyle = textStyle.getStroke();
    if (!textStrokeStyle) {
      this.textStrokeState_ = null;
    } else {
      var textStrokeStyleColor = textStrokeStyle.getColor();
      var textStrokeStyleLineCap = textStrokeStyle.getLineCap();
      var textStrokeStyleLineDash = textStrokeStyle.getLineDash();
      var textStrokeStyleLineJoin = textStrokeStyle.getLineJoin();
      var textStrokeStyleWidth = textStrokeStyle.getWidth();
      var textStrokeStyleMiterLimit = textStrokeStyle.getMiterLimit();
      var lineCap = textStrokeStyleLineCap !== undefined ?
          textStrokeStyleLineCap : ol.render.canvas.defaultLineCap;
      var lineDash = textStrokeStyleLineDash ?
          textStrokeStyleLineDash.slice() : ol.render.canvas.defaultLineDash;
      var lineJoin = textStrokeStyleLineJoin !== undefined ?
          textStrokeStyleLineJoin : ol.render.canvas.defaultLineJoin;
      var lineWidth = textStrokeStyleWidth !== undefined ?
          textStrokeStyleWidth : ol.render.canvas.defaultLineWidth;
      var miterLimit = textStrokeStyleMiterLimit !== undefined ?
          textStrokeStyleMiterLimit : ol.render.canvas.defaultMiterLimit;
      var strokeStyle = ol.color.asString(textStrokeStyleColor ?
          textStrokeStyleColor : ol.render.canvas.defaultStrokeStyle);
      if (!this.textStrokeState_) {
        this.textStrokeState_ = {
          lineCap: lineCap,
          lineDash: lineDash,
          lineJoin: lineJoin,
          lineWidth: lineWidth,
          miterLimit: miterLimit,
          strokeStyle: strokeStyle
        };
      } else {
        var textStrokeState = this.textStrokeState_;
        textStrokeState.lineCap = lineCap;
        textStrokeState.lineDash = lineDash;
        textStrokeState.lineJoin = lineJoin;
        textStrokeState.lineWidth = lineWidth;
        textStrokeState.miterLimit = miterLimit;
        textStrokeState.strokeStyle = strokeStyle;
      }
    }
    var textFont = textStyle.getFont();
    var textOffsetX = textStyle.getOffsetX();
    var textOffsetY = textStyle.getOffsetY();
    var textRotation = textStyle.getRotation();
    var textScale = textStyle.getScale();
    var textText = textStyle.getText();
    var textTextAlign = textStyle.getTextAlign();
    var textTextBaseline = textStyle.getTextBaseline();
    var font = textFont !== undefined ?
        textFont : ol.render.canvas.defaultFont;
    var textAlign = textTextAlign !== undefined ?
        textTextAlign : ol.render.canvas.defaultTextAlign;
    var textBaseline = textTextBaseline !== undefined ?
        textTextBaseline : ol.render.canvas.defaultTextBaseline;
    if (!this.textState_) {
      this.textState_ = {
        font: font,
        textAlign: textAlign,
        textBaseline: textBaseline
      };
    } else {
      var textState = this.textState_;
      textState.font = font;
      textState.textAlign = textAlign;
      textState.textBaseline = textBaseline;
    }
    this.text_ = textText !== undefined ? textText : '';
    this.textOffsetX_ = textOffsetX !== undefined ? textOffsetX : 0;
    this.textOffsetY_ = textOffsetY !== undefined ? textOffsetY : 0;
    this.textRotation_ = textRotation !== undefined ? textRotation : 0;
    this.textScale_ = textScale !== undefined ? textScale : 1;
  }
};



/**
 * @constructor
 * @implements {ol.render.IReplayGroup}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @param {number} resolution Resolution.
 * @param {number=} opt_renderBuffer Optional rendering buffer.
 * @struct
 */
ol.render.canvas.ReplayGroup = function(
    tolerance, maxExtent, resolution, opt_renderBuffer) {

  /**
   * @private
   * @type {number}
   */
  this.tolerance_ = tolerance;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.maxExtent_ = maxExtent;

  /**
   * @private
   * @type {number}
   */
  this.resolution_ = resolution;

  /**
   * @private
   * @type {number|undefined}
   */
  this.renderBuffer_ = opt_renderBuffer;

  /**
   * @private
   * @type {!Object.<string,
   *        Object.<ol.render.ReplayType, ol.render.canvas.Replay>>}
   */
  this.replaysByZIndex_ = {};

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitDetectionContext_ = ol.dom.createCanvasContext2D(1, 1);

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.hitDetectionTransform_ = goog.vec.Mat4.createNumber();

};


/**
 * FIXME empty description for jsdoc
 */
ol.render.canvas.ReplayGroup.prototype.finish = function() {
  var zKey;
  for (zKey in this.replaysByZIndex_) {
    var replays = this.replaysByZIndex_[zKey];
    var replayKey;
    for (replayKey in replays) {
      replays[replayKey].finish();
    }
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function(ol.Feature): T} callback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.forEachFeatureAtCoordinate = function(
    coordinate, resolution, rotation, skippedFeaturesHash, callback) {

  var transform = this.hitDetectionTransform_;
  ol.vec.Mat4.makeTransform2D(transform, 0.5, 0.5,
      1 / resolution, -1 / resolution, -rotation,
      -coordinate[0], -coordinate[1]);

  var context = this.hitDetectionContext_;
  context.clearRect(0, 0, 1, 1);

  /**
   * @type {ol.Extent}
   */
  var hitExtent;
  if (this.renderBuffer_ !== undefined) {
    hitExtent = ol.extent.createEmpty();
    ol.extent.extendCoordinate(hitExtent, coordinate);
    ol.extent.buffer(hitExtent, resolution * this.renderBuffer_, hitExtent);
  }

  return this.replayHitDetection_(context, transform, rotation,
      skippedFeaturesHash,
      /**
       * @param {ol.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        var imageData = context.getImageData(0, 0, 1, 1).data;
        if (imageData[3] > 0) {
          var result = callback(feature);
          if (result) {
            return result;
          }
          context.clearRect(0, 0, 1, 1);
        }
      }, hitExtent);
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.getReplay =
    function(zIndex, replayType) {
  var zIndexKey = zIndex !== undefined ? zIndex.toString() : '0';
  var replays = this.replaysByZIndex_[zIndexKey];
  if (replays === undefined) {
    replays = {};
    this.replaysByZIndex_[zIndexKey] = replays;
  }
  var replay = replays[replayType];
  if (replay === undefined) {
    var Constructor = ol.render.canvas.BATCH_CONSTRUCTORS_[replayType];
    goog.asserts.assert(Constructor !== undefined,
        replayType +
        ' constructor missing from ol.render.canvas.BATCH_CONSTRUCTORS_');
    replay = new Constructor(this.tolerance_, this.maxExtent_,
        this.resolution_);
    replays[replayType] = replay;
  }
  return replay;
};


/**
 * @inheritDoc
 */
ol.render.canvas.ReplayGroup.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.replaysByZIndex_);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 */
ol.render.canvas.ReplayGroup.prototype.replay = function(
    context, pixelRatio, transform, viewRotation, skippedFeaturesHash) {

  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  goog.array.sort(zs);

  // setup clipping so that the parts of over-simplified geometries are not
  // visible outside the current extent when panning
  var maxExtent = this.maxExtent_;
  var minX = maxExtent[0];
  var minY = maxExtent[1];
  var maxX = maxExtent[2];
  var maxY = maxExtent[3];
  var flatClipCoords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY];
  ol.geom.flat.transform.transform2D(
      flatClipCoords, 0, 8, 2, transform, flatClipCoords);
  context.save();
  context.beginPath();
  context.moveTo(flatClipCoords[0], flatClipCoords[1]);
  context.lineTo(flatClipCoords[2], flatClipCoords[3]);
  context.lineTo(flatClipCoords[4], flatClipCoords[5]);
  context.lineTo(flatClipCoords[6], flatClipCoords[7]);
  context.closePath();
  context.clip();

  var i, ii, j, jj, replays, replay;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = 0, jj = ol.render.REPLAY_ORDER.length; j < jj; ++j) {
      replay = replays[ol.render.REPLAY_ORDER[j]];
      if (replay !== undefined) {
        replay.replay(context, pixelRatio, transform, viewRotation,
            skippedFeaturesHash);
      }
    }
  }

  context.restore();
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function(ol.Feature): T} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
ol.render.canvas.ReplayGroup.prototype.replayHitDetection_ = function(
    context, transform, viewRotation, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var zs = Object.keys(this.replaysByZIndex_).map(Number);
  goog.array.sort(zs, function(a, b) { return b - a; });

  var i, ii, j, replays, replay, result;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    replays = this.replaysByZIndex_[zs[i].toString()];
    for (j = ol.render.REPLAY_ORDER.length - 1; j >= 0; --j) {
      replay = replays[ol.render.REPLAY_ORDER[j]];
      if (replay !== undefined) {
        result = replay.replayHitDetection(context, transform, viewRotation,
            skippedFeaturesHash, featureCallback, opt_hitExtent);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
};


/**
 * @const
 * @private
 * @type {Object.<ol.render.ReplayType,
 *                function(new: ol.render.canvas.Replay, number, ol.Extent,
 *                number)>}
 */
ol.render.canvas.BATCH_CONSTRUCTORS_ = {
  'Image': ol.render.canvas.ImageReplay,
  'LineString': ol.render.canvas.LineStringReplay,
  'Polygon': ol.render.canvas.PolygonReplay,
  'Text': ol.render.canvas.TextReplay
};
