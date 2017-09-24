goog.provide('ol.render.canvas.Replay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.extent.Relationship');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.flat.inflate');
goog.require('ol.geom.flat.length');
goog.require('ol.geom.flat.textpath');
goog.require('ol.geom.flat.transform');
goog.require('ol.has');
goog.require('ol.obj');
goog.require('ol.render.VectorContext');
goog.require('ol.render.canvas.Instruction');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @struct
 */
ol.render.canvas.Replay = function(tolerance, maxExtent, resolution, pixelRatio, overlaps) {
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
  this.pixelRatio = pixelRatio;

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
   * @type {Object.<number,ol.Coordinate|Array.<ol.Coordinate>|Array.<Array.<ol.Coordinate>>>}
   */
  this.coordinateCache_ = {};

  /**
   * @private
   * @type {!ol.Transform}
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
  this.pixelCoordinates_ = null;

  /**
   * @private
   * @type {!ol.Transform}
   */
  this.tmpLocalTransform_ = ol.transform.create();

  /**
   * @private
   * @type {!ol.Transform}
   */
  this.resetTransform_ = ol.transform.create();

  /**
   * @private
   * @type {Array.<Array.<number>>}
   */
  this.chars_ = [];
};
ol.inherits(ol.render.canvas.Replay, ol.render.VectorContext);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image Image.
 * @param {number} anchorX Anchor X.
 * @param {number} anchorY Anchor Y.
 * @param {number} height Height.
 * @param {number} opacity Opacity.
 * @param {number} originX Origin X.
 * @param {number} originY Origin Y.
 * @param {number} rotation Rotation.
 * @param {number} scale Scale.
 * @param {boolean} snapToPixel Snap to pixel.
 * @param {number} width Width.
 */
ol.render.canvas.Replay.prototype.replayImage_ = function(context, x, y, image, anchorX, anchorY,
    height, opacity, originX, originY, rotation, scale, snapToPixel, width) {
  var localTransform = this.tmpLocalTransform_;
  anchorX *= scale;
  anchorY *= scale;
  x -= anchorX;
  y -= anchorY;
  if (snapToPixel) {
    x = Math.round(x);
    y = Math.round(y);
  }
  if (rotation !== 0) {
    var centerX = x + anchorX;
    var centerY = y + anchorY;
    ol.transform.compose(localTransform,
        centerX, centerY, 1, 1, rotation, -centerX, -centerY);
    context.setTransform.apply(context, localTransform);
  }
  var alpha = context.globalAlpha;
  if (opacity != 1) {
    context.globalAlpha = alpha * opacity;
  }

  var w = (width + originX > image.width) ? image.width - originX : width;
  var h = (height + originY > image.height) ? image.height - originY : height;

  context.drawImage(image, originX, originY, w, h, x, y, w * scale, h * scale);

  if (opacity != 1) {
    context.globalAlpha = alpha;
  }
  if (rotation !== 0) {
    context.setTransform.apply(context, this.resetTransform_);
  }
};


/**
 * @protected
 * @param {Array.<number>} dashArray Dash array.
 * @return {Array.<number>} Dash array with pixel ratio applied
 */
ol.render.canvas.Replay.prototype.applyPixelRatio = function(dashArray) {
  var pixelRatio = this.pixelRatio;
  return pixelRatio == 1 ? dashArray : dashArray.map(function(dash) {
    return dash * pixelRatio;
  });
};


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
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array.<number>} replayEnds Replay ends.
 * @return {number} Offset.
 */
ol.render.canvas.Replay.prototype.drawCustomCoordinates_ = function(flatCoordinates, offset, ends, stride, replayEnds) {
  for (var i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    var replayEnd = this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false, false);
    replayEnds.push(replayEnd);
    offset = end;
  }
  return offset;
};


/**
 * @inheritDoc.
 */
ol.render.canvas.Replay.prototype.drawCustom = function(geometry, feature, renderer) {
  this.beginGeometry(geometry, feature);
  var type = geometry.getType();
  var stride = geometry.getStride();
  var replayBegin = this.coordinates.length;
  var flatCoordinates, replayEnd, replayEnds, replayEndss;
  var offset;
  if (type == ol.geom.GeometryType.MULTI_POLYGON) {
    geometry = /** @type {ol.geom.MultiPolygon} */ (geometry);
    flatCoordinates = geometry.getOrientedFlatCoordinates();
    replayEndss = [];
    var endss = geometry.getEndss();
    offset = 0;
    for (var i = 0, ii = endss.length; i < ii; ++i) {
      var myEnds = [];
      offset = this.drawCustomCoordinates_(flatCoordinates, offset, endss[i], stride, myEnds);
      replayEndss.push(myEnds);
    }
    this.instructions.push([ol.render.canvas.Instruction.CUSTOM,
      replayBegin, replayEndss, geometry, renderer, ol.geom.flat.inflate.coordinatesss]);
  } else if (type == ol.geom.GeometryType.POLYGON || type == ol.geom.GeometryType.MULTI_LINE_STRING) {
    replayEnds = [];
    flatCoordinates = (type == ol.geom.GeometryType.POLYGON) ?
      /** @type {ol.geom.Polygon} */ (geometry).getOrientedFlatCoordinates() :
      geometry.getFlatCoordinates();
    offset = this.drawCustomCoordinates_(flatCoordinates, 0,
        /** @type {ol.geom.Polygon|ol.geom.MultiLineString} */ (geometry).getEnds(),
        stride, replayEnds);
    this.instructions.push([ol.render.canvas.Instruction.CUSTOM,
      replayBegin, replayEnds, geometry, renderer, ol.geom.flat.inflate.coordinatess]);
  } else if (type == ol.geom.GeometryType.LINE_STRING || type == ol.geom.GeometryType.MULTI_POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    replayEnd = this.appendFlatCoordinates(
        flatCoordinates, 0, flatCoordinates.length, stride, false, false);
    this.instructions.push([ol.render.canvas.Instruction.CUSTOM,
      replayBegin, replayEnd, geometry, renderer, ol.geom.flat.inflate.coordinates]);
  } else if (type == ol.geom.GeometryType.POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    this.coordinates.push(flatCoordinates[0], flatCoordinates[1]);
    replayEnd = this.coordinates.length;
    this.instructions.push([ol.render.canvas.Instruction.CUSTOM,
      replayBegin, replayEnd, geometry, renderer]);
  }
  this.endGeometry(geometry, feature);
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
    context, transform, viewRotation, skippedFeaturesHash,
    instructions, featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (this.pixelCoordinates_ && ol.array.equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = ol.geom.flat.transform.transform2D(
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
    ol.transform.setFromArray(this.renderedTransform_, transform);
  }
  var skipFeatures = !ol.obj.isEmpty(skippedFeaturesHash);
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d = 0; // data index
  var dd; // end of per-instruction data
  var anchorX, anchorY, prevX, prevY, roundX, roundY;
  var pendingFill = 0;
  var pendingStroke = 0;
  var coordinateCache = this.coordinateCache_;

  var state = /** @type {olx.render.State} */ ({
    context: context,
    pixelRatio: this.pixelRatio,
    resolution: this.resolution,
    rotation: viewRotation
  });

  // When the batch size gets too big, performance decreases. 200 is a good
  // balance between batch size and number of fill/stroke instructions.
  var batchSize =
      this.instructions != instructions || this.overlaps ? 0 : 200;
  while (i < ii) {
    var instruction = instructions[i];
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    var /** @type {ol.Feature|ol.render.Feature} */ feature, x, y;
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
          prevX = prevY = NaN;
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.CIRCLE:
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
      case ol.render.canvas.Instruction.CUSTOM:
        d = /** @type {number} */ (instruction[1]);
        dd = instruction[2];
        var geometry = /** @type {ol.geom.SimpleGeometry} */ (instruction[3]);
        var renderer = instruction[4];
        var fn = instruction.length == 6 ? instruction[5] : undefined;
        state.geometry = geometry;
        state.feature = feature;
        if (!(i in coordinateCache)) {
          coordinateCache[i] = [];
        }
        var coords = coordinateCache[i];
        if (fn) {
          fn(pixelCoordinates, d, dd, 2, coords);
        } else {
          coords[0] = pixelCoordinates[d];
          coords[1] = pixelCoordinates[d + 1];
          coords.length = 2;
        }
        renderer(coords, state);
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        var image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
            (instruction[3]);
        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        anchorX = /** @type {number} */ (instruction[4]);
        anchorY = /** @type {number} */ (instruction[5]);
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
          this.replayImage_(context, pixelCoordinates[d], pixelCoordinates[d + 1],
              image, anchorX, anchorY, height, opacity, originX, originY,
              rotation, scale, snapToPixel, width);
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_CHARS:
        var begin = /** @type {number} */ (instruction[1]);
        var end = /** @type {number} */ (instruction[2]);
        var images =  /** @type {Array.<HTMLCanvasElement>} */ (instruction[3]);
        // Remaining arguments in DRAW_CHARS are in alphabetical order
        var baseline = /** @type {number} */ (instruction[4]);
        var exceedLength = /** @type {number} */ (instruction[5]);
        var maxAngle = /** @type {number} */ (instruction[6]);
        var measure = /** @type {function(string):number} */ (instruction[7]);
        var offsetY = /** @type {number} */ (instruction[8]);
        var text = /** @type {string} */ (instruction[9]);
        var align = /** @type {number} */ (instruction[10]);
        var textScale = /** @type {number} */ (instruction[11]);

        var pathLength = ol.geom.flat.length.lineString(pixelCoordinates, begin, end, 2);
        var textLength = measure(text);
        if (exceedLength || textLength <= pathLength) {
          var startM = (pathLength - textLength) * align;
          var chars = ol.geom.flat.textpath.lineString(
              pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle, this.chars_);
          var numChars = text.length;
          if (chars) {
            var fillHeight = images[images.length - 1].height;
            for (var c = 0, cc = images.length; c < cc; ++c) {
              var char = chars[c % numChars]; // x, y, rotation
              var label = images[c];
              anchorX = label.width / 2;
              anchorY = baseline * label.height + (0.5 - baseline) * (label.height - fillHeight) - offsetY;
              this.replayImage_(context, char[0], char[1], label, anchorX, anchorY,
                  label.height, 1, 0, 0, char[2], textScale, false, label.width);
            }
          }
        }

        ++i;
        break;
      case ol.render.canvas.Instruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
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
        d = /** @type {number} */ (instruction[1]);
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
        this.fillOrigin_ = instruction[2];

        if (pendingFill) {
          this.fill_(context, viewRotation);
          pendingFill = 0;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
        }

        context.fillStyle = /** @type {ol.ColorLike} */ (instruction[1]);
        ++i;
        break;
      case ol.render.canvas.Instruction.SET_STROKE_STYLE:
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        context.strokeStyle = /** @type {ol.ColorLike} */ (instruction[1]);
        context.lineWidth = /** @type {number} */ (instruction[2]);
        context.lineCap = /** @type {string} */ (instruction[3]);
        context.lineJoin = /** @type {string} */ (instruction[4]);
        context.miterLimit = /** @type {number} */ (instruction[5]);
        if (ol.has.CANVAS_LINE_DASH) {
          context.lineDashOffset = /** @type {number} */ (instruction[7]);
          context.setLineDash(/** @type {Array.<number>} */ (instruction[6]));
        }
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
  return undefined;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 */
ol.render.canvas.Replay.prototype.replay = function(
    context, transform, viewRotation, skippedFeaturesHash) {
  var instructions = this.instructions;
  this.replay_(context, transform, viewRotation,
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
  return this.replay_(context, transform, viewRotation,
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
      begin = i;
    } else if (type == ol.render.canvas.Instruction.BEGIN_GEOMETRY) {
      instruction[2] = i;
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
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
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
