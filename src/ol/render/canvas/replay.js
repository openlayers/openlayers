goog.provide('ol.render.canvas.Replay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.colorlike');
goog.require('ol.extent');
goog.require('ol.extent.Relationship');
goog.require('ol.geom.flat.transform');
goog.require('ol.has');
goog.require('ol.obj');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
ol.render.canvas.Replay = function(tolerance, maxExtent, resolution, overlaps) {
  ol.render.VectorContext.call(this);

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
   * @protected
   * @type {boolean}
   */
  this.overlaps = overlaps;

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
   * @type {ol.Coordinate}
   */
  this.fillOrigin_;

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
   * @type {ol.Transform}
   */
  this.renderedTransform_ = ol.transform.create();

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
   * @type {ol.Transform}
   */
  this.tmpLocalTransform_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.resetTransform_ = ol.transform.create();
};
ol.inherits(ol.render.canvas.Replay, ol.render.VectorContext);


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {boolean} closed Last input coordinate equals first.
 * @param {boolean} skipFirst Skip first coordinate.
 * @protected
 * @return {number} My end.
 */
ol.render.canvas.Replay.prototype.appendFlatCoordinates = function(flatCoordinates, offset, end, stride, closed, skipFirst) {

  var myEnd = this.coordinates.length;
  var extent = this.getBufferedMaxExtent();
  if (skipFirst) {
    offset += stride;
  }
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

  // Last coordinate equals first or only one point to append:
  if ((closed && skipped) || i === offset + stride) {
    this.coordinates[myEnd++] = lastCoord[0];
    this.coordinates[myEnd++] = lastCoord[1];
  }
  return myEnd;
};


/**
 * @protected
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
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
 * @param {number} rotation Rotation.
 */
ol.render.canvas.Replay.prototype.fill_ = function(context, rotation) {
  if (this.fillOrigin_) {
    var origin = ol.transform.apply(this.renderedTransform_, this.fillOrigin_.slice());
    context.translate(origin[0], origin[1]);
    context.rotate(rotation);
  }
  context.fill();
  if (this.fillOrigin_) {
    context.setTransform.apply(context, this.resetTransform_);
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<*>} instructions Instructions array.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined}
 *     featureCallback Feature callback.
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
  if (ol.array.equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    pixelCoordinates = ol.geom.flat.transform.transform2D(
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
    ol.transform.setFromArray(this.renderedTransform_, transform);
    ol.DEBUG && console.assert(pixelCoordinates === this.pixelCoordinates_,
        'pixelCoordinates should be the same as this.pixelCoordinates_');
  }
  var skipFeatures = !ol.obj.isEmpty(skippedFeaturesHash);
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d = 0; // data index
  var dd; // end of per-instruction data
  var localTransform = this.tmpLocalTransform_;
  var resetTransform = this.resetTransform_;
  var prevX, prevY, roundX, roundY;
  var pendingFill = 0;
  var pendingStroke = 0;
  // When the batch size gets too big, performance decreases. 200 is a good
  // balance between batch size and number of fill/stroke instructions.
  var batchSize =
      this.instructions != instructions || this.overlaps ? 0 : 200;
  while (i < ii) {
    var instruction = instructions[i];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    var feature, fill, stroke, text, x, y;
    switch (type) {
      case ol.render.canvas.Instruction.BEGIN_GEOMETRY:
        feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
        if ((skipFeatures &&
            skippedFeaturesHash[ol.getUid(feature).toString()]) ||
            !feature.getGeometry()) {
          i = /** @type {number} */ (instruction[2]);
        } else if (opt_hitExtent !== undefined && !ol.extent.intersects(
            opt_hitExtent, feature.getGeometry().getExtent())) {
          i = /** @type {number} */ (instruction[2]) + 1;
        } else {
          ++i;
        }
        break;
      case ol.render.canvas.Instruction.BEGIN_PATH:
        if (pendingFill > batchSize) {
          this.fill_(context, viewRotation);
          pendingFill = 0;
        }
        if (pendingStroke > batchSize) {
          context.stroke();
          pendingStroke = 0;
        }
        if (!pendingFill && !pendingStroke) {
          context.beginPath();
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.CIRCLE:
        ol.DEBUG && console.assert(typeof instruction[1] === 'number',
            'second instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        var x1 = pixelCoordinates[d];
        var y1 = pixelCoordinates[d + 1];
        var x2 = pixelCoordinates[d + 2];
        var y2 = pixelCoordinates[d + 3];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var r = Math.sqrt(dx * dx + dy * dy);
        context.moveTo(x1 + r, y1);
        context.arc(x1, y1, r, 0, 2 * Math.PI, true);
        ++i;
        break;
      case ol.render.canvas.Instruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_IMAGE:
        ol.DEBUG && console.assert(typeof instruction[1] === 'number',
            'second instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        ol.DEBUG && console.assert(typeof instruction[2] === 'number',
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
            x = Math.round(x);
            y = Math.round(y);
          }
          if (scale != 1 || rotation !== 0) {
            var centerX = x + anchorX;
            var centerY = y + anchorY;
            ol.transform.compose(localTransform,
                centerX, centerY, scale, scale, rotation, -centerX, -centerY);
            context.setTransform.apply(context, localTransform);
          }
          var alpha = context.globalAlpha;
          if (opacity != 1) {
            context.globalAlpha = alpha * opacity;
          }

          var w = (width + originX > image.width) ? image.width - originX : width;
          var h = (height + originY > image.height) ? image.height - originY : height;

          context.drawImage(image, originX, originY, w, h,
              x, y, w * pixelRatio, h * pixelRatio);

          if (opacity != 1) {
            context.globalAlpha = alpha;
          }
          if (scale != 1 || rotation !== 0) {
            context.setTransform.apply(context, resetTransform);
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_TEXT:
        ol.DEBUG && console.assert(typeof instruction[1] === 'number',
            '2nd instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        ol.DEBUG && console.assert(typeof instruction[2] === 'number',
            '3rd instruction should be a number');
        dd = /** @type {number} */ (instruction[2]);
        ol.DEBUG && console.assert(typeof instruction[3] === 'string',
            '4th instruction should be a string');
        text = /** @type {string} */ (instruction[3]);
        ol.DEBUG && console.assert(typeof instruction[4] === 'number',
            '5th instruction should be a number');
        var offsetX = /** @type {number} */ (instruction[4]) * pixelRatio;
        ol.DEBUG && console.assert(typeof instruction[5] === 'number',
            '6th instruction should be a number');
        var offsetY = /** @type {number} */ (instruction[5]) * pixelRatio;
        ol.DEBUG && console.assert(typeof instruction[6] === 'number',
            '7th instruction should be a number');
        rotation = /** @type {number} */ (instruction[6]);
        ol.DEBUG && console.assert(typeof instruction[7] === 'number',
            '8th instruction should be a number');
        scale = /** @type {number} */ (instruction[7]) * pixelRatio;
        ol.DEBUG && console.assert(typeof instruction[8] === 'boolean',
            '9th instruction should be a boolean');
        fill = /** @type {boolean} */ (instruction[8]);
        ol.DEBUG && console.assert(typeof instruction[9] === 'boolean',
            '10th instruction should be a boolean');
        stroke = /** @type {boolean} */ (instruction[9]);
        rotateWithView = /** @type {boolean} */ (instruction[10]);
        if (rotateWithView) {
          rotation += viewRotation;
        }
        for (; d < dd; d += 2) {
          x = pixelCoordinates[d] + offsetX;
          y = pixelCoordinates[d + 1] + offsetY;
          if (scale != 1 || rotation !== 0) {
            ol.transform.compose(localTransform, x, y, scale, scale, rotation, -x, -y);
            context.setTransform.apply(context, localTransform);
          }

          // Support multiple lines separated by \n
          var lines = text.split('\n');
          var numLines = lines.length;
          var fontSize, lineY;
          if (numLines > 1) {
            // Estimate line height using width of capital M, and add padding
            fontSize = Math.round(context.measureText('M').width * 1.5);
            lineY = y - (((numLines - 1) / 2) * fontSize);
          } else {
            // No need to calculate line height/offset for a single line
            fontSize = 0;
            lineY = y;
          }

          for (var lineIndex = 0; lineIndex < numLines; lineIndex++) {
            var line = lines[lineIndex];
            if (stroke) {
              context.strokeText(line, x, lineY);
            }
            if (fill) {
              context.fillText(line, x, lineY);
            }

            // Move next line down by fontSize px
            lineY = lineY + fontSize;
          }

          if (scale != 1 || rotation !== 0) {
            context.setTransform.apply(context, resetTransform);
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature =
              /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
          var result = featureCallback(feature);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context, viewRotation);
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.MOVE_TO_LINE_TO:
        ol.DEBUG && console.assert(typeof instruction[1] === 'number',
            '2nd instruction should be a number');
        d = /** @type {number} */ (instruction[1]);
        ol.DEBUG && console.assert(typeof instruction[2] === 'number',
            '3rd instruction should be a number');
        dd = /** @type {number} */ (instruction[2]);
        x = pixelCoordinates[d];
        y = pixelCoordinates[d + 1];
        roundX = (x + 0.5) | 0;
        roundY = (y + 0.5) | 0;
        if (roundX !== prevX || roundY !== prevY) {
          context.moveTo(x, y);
          prevX = roundX;
          prevY = roundY;
        }
        for (d += 2; d < dd; d += 2) {
          x = pixelCoordinates[d];
          y = pixelCoordinates[d + 1];
          roundX = (x + 0.5) | 0;
          roundY = (y + 0.5) | 0;
          if (d == dd - 2 || roundX !== prevX || roundY !== prevY) {
            context.lineTo(x, y);
            prevX = roundX;
            prevY = roundY;
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_FILL_STYLE:
        ol.DEBUG && console.assert(
            ol.colorlike.isColorLike(instruction[1]),
            '2nd instruction should be a string, ' +
            'CanvasPattern, or CanvasGradient');
        this.fillOrigin_ = instruction[2];

        if (pendingFill) {
          this.fill_(context, viewRotation);
          pendingFill = 0;
        }

        context.fillStyle = /** @type {ol.ColorLike} */ (instruction[1]);
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_STROKE_STYLE:
        ol.DEBUG && console.assert(ol.colorlike.isColorLike(instruction[1]),
            '2nd instruction should be a string, CanvasPattern, or CanvasGradient');
        ol.DEBUG && console.assert(typeof instruction[2] === 'number',
            '3rd instruction should be a number');
        ol.DEBUG && console.assert(typeof instruction[3] === 'string',
            '4rd instruction should be a string');
        ol.DEBUG && console.assert(typeof instruction[4] === 'string',
            '5th instruction should be a string');
        ol.DEBUG && console.assert(typeof instruction[5] === 'number',
            '6th instruction should be a number');
        ol.DEBUG && console.assert(instruction[6],
            '7th instruction should not be null');
        ol.DEBUG && console.assert(typeof instruction[8] === 'number',
            '9th instruction should be a number');
        var usePixelRatio = instruction[7] !== undefined ?
            instruction[7] : true;
        var renderedPixelRatio = instruction[8];

        var lineWidth = /** @type {number} */ (instruction[2]);
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        context.strokeStyle = /** @type {ol.ColorLike} */ (instruction[1]);
        context.lineWidth = usePixelRatio ? lineWidth * pixelRatio : lineWidth;
        context.lineCap = /** @type {string} */ (instruction[3]);
        context.lineJoin = /** @type {string} */ (instruction[4]);
        context.miterLimit = /** @type {number} */ (instruction[5]);
        if (ol.has.CANVAS_LINE_DASH) {
          var lineDash = /** @type {Array.<number>} */ (instruction[6]);
          if (usePixelRatio && pixelRatio !== renderedPixelRatio) {
            lineDash = lineDash.map(function(dash) {
              return dash * pixelRatio / renderedPixelRatio;
            });
            instruction[6] = lineDash;
            instruction[8] = pixelRatio;
          }
          context.setLineDash(lineDash);
        }
        prevX = NaN;
        prevY = NaN;
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_TEXT_STYLE:
        ol.DEBUG && console.assert(typeof instruction[1] === 'string',
            '2nd instruction should be a string');
        ol.DEBUG && console.assert(typeof instruction[2] === 'string',
            '3rd instruction should be a string');
        ol.DEBUG && console.assert(typeof instruction[3] === 'string',
            '4th instruction should be a string');
        context.font = /** @type {string} */ (instruction[1]);
        context.textAlign = /** @type {string} */ (instruction[2]);
        context.textBaseline = /** @type {string} */ (instruction[3]);
        ++i;
        break;
      case ol.render.canvas.Instruction.STROKE:
        if (batchSize) {
          pendingStroke++;
        } else {
          context.stroke();
        }
        ++i;
        break;
      default:
        ol.DEBUG && console.assert(false, 'Unknown canvas render instruction');
        ++i; // consume the instruction anyway, to avoid an infinite loop
        break;
    }
  }
  if (pendingFill) {
    this.fill_(context, viewRotation);
  }
  if (pendingStroke) {
    context.stroke();
  }
  // assert that all instructions were consumed
  ol.DEBUG && console.assert(i == instructions.length,
      'all instructions should be consumed');
  return undefined;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 */
ol.render.canvas.Replay.prototype.replay = function(
    context, pixelRatio, transform, viewRotation, skippedFeaturesHash) {
  var instructions = this.instructions;
  this.replay_(context, pixelRatio, transform, viewRotation,
      skippedFeaturesHash, instructions, undefined, undefined);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T=} opt_featureCallback
 *     Feature callback.
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
 * Reverse the hit detection instructions.
 */
ol.render.canvas.Replay.prototype.reverseHitDetectionInstructions = function() {
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
      ol.DEBUG && console.assert(begin == -1, 'begin should be -1');
      begin = i;
    } else if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      instruction[2] = i;
      ol.DEBUG && console.assert(begin >= 0,
          'begin should be larger than or equal to 0');
      ol.array.reverseSubArray(this.hitDetectionInstructions, begin, i);
      begin = -1;
    }
  }
};


/**
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
ol.render.canvas.Replay.prototype.endGeometry = function(geometry, feature) {
  ol.DEBUG && console.assert(this.beginGeometryInstruction1_,
      'this.beginGeometryInstruction1_ should not be null');
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
  ol.DEBUG && console.assert(this.beginGeometryInstruction2_,
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
