goog.provide('ol.render.canvas.Replay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.colorlike');
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
goog.require('ol.render.canvas');
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
 * @param {?} declutterTree Declutter tree.
 * @struct
 */
ol.render.canvas.Replay = function(tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  ol.render.VectorContext.call(this);

  /**
   * @type {?}
   */
  this.declutterTree = declutterTree;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

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
   * @private
   * @type {ol.Extent}
   */
  this.bufferedMaxExtent_ = null;

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
   * @protected
   * @type {ol.CanvasFillStrokeState}
   */
  this.state = /** @type {ol.CanvasFillStrokeState} */ ({});

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
};
ol.inherits(ol.render.canvas.Replay, ol.render.VectorContext);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image Image.
 * @param {number} anchorX Anchor X.
 * @param {number} anchorY Anchor Y.
 * @param {ol.DeclutterGroup} declutterGroup Declutter group.
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
    declutterGroup, height, opacity, originX, originY, rotation, scale, snapToPixel, width) {
  var localTransform = this.tmpLocalTransform_;
  anchorX *= scale;
  anchorY *= scale;
  x -= anchorX;
  y -= anchorY;
  if (snapToPixel) {
    x = Math.round(x);
    y = Math.round(y);
  }

  var w = (width + originX > image.width) ? image.width - originX : width;
  var h = (height + originY > image.height) ? image.height - originY : height;
  var box = this.tmpExtent_;

  var transform = null;
  if (rotation !== 0) {
    var centerX = x + anchorX;
    var centerY = y + anchorY;
    transform = ol.transform.compose(localTransform,
        centerX, centerY, 1, 1, rotation, -centerX, -centerY);
    ol.extent.createOrUpdateEmpty(box);
    ol.extent.extendCoordinate(box, ol.transform.apply(localTransform, [x, y]));
    ol.extent.extendCoordinate(box, ol.transform.apply(localTransform, [x + w, y]));
    ol.extent.extendCoordinate(box, ol.transform.apply(localTransform, [x + w, y + h]));
    ol.extent.extendCoordinate(box, ol.transform.apply(localTransform, [x, y + w]));
  } else {
    ol.extent.createOrUpdate(x, y, x + w * scale, y + h * scale, box);
  }
  var canvas = context.canvas;
  var intersects = box[0] <= canvas.width && box[2] >= 0 && box[1] <= canvas.height && box[3] >= 0;
  if (declutterGroup) {
    if (!intersects && declutterGroup[4] == 1) {
      return;
    }
    ol.extent.extend(declutterGroup, box);
    declutterGroup.push(intersects ?
      [context, transform ? transform.slice(0) : null, opacity, image, originX, originY, w, h, x, y, scale] :
      null);
  } else if (intersects) {
    ol.render.canvas.drawImage(context, transform, opacity, image, originX, originY, w, h, x, y, scale);
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
    context.setTransform.apply(context, ol.render.canvas.resetTransform_);
  }
};


/**
 * @param {ol.DeclutterGroup} declutterGroup Declutter group.
 */
ol.render.canvas.Replay.prototype.renderDeclutter_ = function(declutterGroup) {
  if (declutterGroup && declutterGroup.length > 5) {
    var groupCount = declutterGroup[4];
    if (groupCount == 1 || groupCount == declutterGroup.length - 5) {
      /** @type {ol.RBushEntry} */
      var box = {
        minX: /** @type {number} */ (declutterGroup[0]),
        minY: /** @type {number} */ (declutterGroup[1]),
        maxX: /** @type {number} */ (declutterGroup[2]),
        maxY: /** @type {number} */ (declutterGroup[3])
      };
      if (!this.declutterTree.collides(box)) {
        this.declutterTree.insert(box);
        var drawImage = ol.render.canvas.drawImage;
        for (var j = 5, jj = declutterGroup.length; j < jj; ++j) {
          if (declutterGroup[j]) {
            drawImage.apply(undefined, /** @type {Array} */ (declutterGroup[j]));
          }
        }
      }
      declutterGroup.length = 5;
      ol.extent.createOrUpdateEmpty(declutterGroup);
    }
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
  var anchorX, anchorY, prevX, prevY, roundX, roundY, declutterGroup;
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
        declutterGroup = /** @type {ol.DeclutterGroup} */ (instruction[6]);
        var height = /** @type {number} */ (instruction[7]);
        var opacity = /** @type {number} */ (instruction[8]);
        var originX = /** @type {number} */ (instruction[9]);
        var originY = /** @type {number} */ (instruction[10]);
        var rotateWithView = /** @type {boolean} */ (instruction[11]);
        var rotation = /** @type {number} */ (instruction[12]);
        var scale = /** @type {number} */ (instruction[13]);
        var snapToPixel = /** @type {boolean} */ (instruction[14]);
        var width = /** @type {number} */ (instruction[15]);

        if (rotateWithView) {
          rotation += viewRotation;
        }
        for (; d < dd; d += 2) {
          this.replayImage_(context,
              pixelCoordinates[d], pixelCoordinates[d + 1], image, anchorX, anchorY,
              declutterGroup, height, opacity, originX, originY, rotation, scale, snapToPixel, width);
        }
        this.renderDeclutter_(declutterGroup);
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_CHARS:
        var begin = /** @type {number} */ (instruction[1]);
        var end = /** @type {number} */ (instruction[2]);
        var baseline = /** @type {number} */ (instruction[3]);
        declutterGroup = /** @type {ol.DeclutterGroup} */ (instruction[4]);
        var exceedLength = /** @type {number} */ (instruction[5]);
        var fill = /** @type {boolean} */ (instruction[6]);
        var maxAngle = /** @type {number} */ (instruction[7]);
        var measure = /** @type {function(string):number} */ (instruction[8]);
        var offsetY = /** @type {number} */ (instruction[9]);
        var stroke = /** @type {boolean} */ (instruction[10]);
        var strokeWidth =  /** @type {number} */ (instruction[11]);
        var text = /** @type {string} */ (instruction[12]);
        var textAlign = /** @type {number} */ (instruction[13]);
        var textScale = /** @type {number} */ (instruction[14]);

        var pathLength = ol.geom.flat.length.lineString(pixelCoordinates, begin, end, 2);
        var textLength = measure(text);
        if (exceedLength || textLength <= pathLength) {
          var startM = (pathLength - textLength) * textAlign;
          var parts = ol.geom.flat.textpath.lineString(
              pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle);
          if (parts) {
            var c, cc, chars, label, part;
            if (stroke) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, false, true);
                anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width);
              }
            }
            if (fill) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, true, false);
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width);
              }
            }
          }
        }
        this.renderDeclutter_(declutterGroup);
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
 * @inheritDoc
 */
ol.render.canvas.Replay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  var state = this.state;
  if (fillStyle) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = ol.colorlike.asColorLike(fillStyleColor ?
      fillStyleColor : ol.render.canvas.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (strokeStyle) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = ol.colorlike.asColorLike(strokeStyleColor ?
      strokeStyleColor : ol.render.canvas.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.canvas.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash.slice() : ol.render.canvas.defaultLineDash;
    var strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    state.lineDashOffset = strokeStyleLineDashOffset ?
      strokeStyleLineDashOffset : ol.render.canvas.defaultLineDashOffset;
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
    state.lineDashOffset = undefined;
    state.lineJoin = undefined;
    state.lineWidth = undefined;
    state.miterLimit = undefined;
  }
};


/**
 * @param {ol.CanvasFillStrokeState} state State.
 * @param {boolean} managePath Manage stoke() - beginPath() for linestrings.
 */
ol.render.canvas.Replay.prototype.updateStrokeStyle = function(state, managePath) {
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineDashOffset = state.lineDashOffset;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      !ol.array.equals(state.currentLineDash, lineDash) ||
      state.currentLineDashOffset != lineDashOffset ||
      state.currentLineJoin != lineJoin ||
      state.currentLineWidth != lineWidth ||
      state.currentMiterLimit != miterLimit) {
    if (managePath) {
      if (state.lastStroke != undefined && state.lastStroke != this.coordinates.length) {
        this.instructions.push([ol.render.canvas.Instruction.STROKE]);
        state.lastStroke = this.coordinates.length;
      }
      state.lastStroke = 0;
    }
    this.instructions.push([
      ol.render.canvas.Instruction.SET_STROKE_STYLE,
      strokeStyle, lineWidth * this.pixelRatio, lineCap, lineJoin, miterLimit,
      this.applyPixelRatio(lineDash), lineDashOffset * this.pixelRatio
    ]);
    if (managePath) {
      this.instructions.push([ol.render.canvas.Instruction.BEGIN_PATH]);
    }
    state.currentStrokeStyle = strokeStyle;
    state.currentLineCap = lineCap;
    state.currentLineDash = lineDash;
    state.currentLineDashOffset = lineDashOffset;
    state.currentLineJoin = lineJoin;
    state.currentLineWidth = lineWidth;
    state.currentMiterLimit = miterLimit;
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
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = ol.extent.clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      ol.extent.buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};
