/**
 * @module ol/render/canvas/Replay
 */
import {getUid, inherits, nullFunction} from '../../index.js';
import {equals, reverseSubArray} from '../../array.js';
import {asColorLike} from '../../colorlike.js';
import {buffer, clone, coordinateRelationship, createEmpty, createOrUpdate,
  createOrUpdateEmpty, extend, extendCoordinate, intersects} from '../../extent.js';
import Relationship from '../../extent/Relationship.js';
import GeometryType from '../../geom/GeometryType.js';
import _ol_geom_flat_inflate_ from '../../geom/flat/inflate.js';
import _ol_geom_flat_length_ from '../../geom/flat/length.js';
import _ol_geom_flat_textpath_ from '../../geom/flat/textpath.js';
import _ol_geom_flat_transform_ from '../../geom/flat/transform.js';
import _ol_has_ from '../../has.js';
import _ol_obj_ from '../../obj.js';
import VectorContext from '../VectorContext.js';
import _ol_render_canvas_ from '../canvas.js';
import _ol_render_canvas_Instruction_ from '../canvas/Instruction.js';
import _ol_render_replay_ from '../replay.js';
import _ol_transform_ from '../../transform.js';

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
var _ol_render_canvas_Replay_ = function(tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  VectorContext.call(this);

  /**
   * @type {?}
   */
  this.declutterTree = declutterTree;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = createEmpty();

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
  this.renderedTransform_ = _ol_transform_.create();

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
   * @type {number}
   */
  this.viewRotation_ = 0;

  /**
   * @private
   * @type {!ol.Transform}
   */
  this.tmpLocalTransform_ = _ol_transform_.create();

  /**
   * @private
   * @type {!ol.Transform}
   */
  this.resetTransform_ = _ol_transform_.create();
};

inherits(_ol_render_canvas_Replay_, VectorContext);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Coordinate} p1 1st point of the background box.
 * @param {ol.Coordinate} p2 2nd point of the background box.
 * @param {ol.Coordinate} p3 3rd point of the background box.
 * @param {ol.Coordinate} p4 4th point of the background box.
 * @param {Array.<*>} fillInstruction Fill instruction.
 * @param {Array.<*>} strokeInstruction Stroke instruction.
 */
_ol_render_canvas_Replay_.prototype.replayTextBackground_ = function(context, p1, p2, p3, p4,
    fillInstruction, strokeInstruction) {
  context.beginPath();
  context.moveTo.apply(context, p1);
  context.lineTo.apply(context, p2);
  context.lineTo.apply(context, p3);
  context.lineTo.apply(context, p4);
  context.lineTo.apply(context, p1);
  if (fillInstruction) {
    this.fillOrigin_ = /** @type {Array.<number>} */ (fillInstruction[2]);
    this.fill_(context);
  }
  if (strokeInstruction) {
    this.setStrokeStyle_(context, /** @type {Array.<*>} */ (strokeInstruction));
    context.stroke();
  }
};


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
 * @param {Array.<number>} padding Padding.
 * @param {Array.<*>} fillInstruction Fill instruction.
 * @param {Array.<*>} strokeInstruction Stroke instruction.
 */
_ol_render_canvas_Replay_.prototype.replayImage_ = function(context, x, y, image,
    anchorX, anchorY, declutterGroup, height, opacity, originX, originY,
    rotation, scale, snapToPixel, width, padding, fillInstruction, strokeInstruction) {
  var fillStroke = fillInstruction || strokeInstruction;
  var localTransform = this.tmpLocalTransform_;
  anchorX *= scale;
  anchorY *= scale;
  x -= anchorX;
  y -= anchorY;

  var w = (width + originX > image.width) ? image.width - originX : width;
  var h = (height + originY > image.height) ? image.height - originY : height;
  var box = this.tmpExtent_;
  var boxW = padding[3] + w * scale + padding[1];
  var boxH = padding[0] + h * scale + padding[2];
  var boxX = x - padding[3];
  var boxY = y - padding[0];

  /** @type {ol.Coordinate} */
  var p1;
  /** @type {ol.Coordinate} */
  var p2;
  /** @type {ol.Coordinate} */
  var p3;
  /** @type {ol.Coordinate} */
  var p4;
  if (fillStroke || rotation !== 0) {
    p1 = [boxX, boxY];
    p2 = [boxX + boxW, boxY];
    p3 = [boxX + boxW, boxY + boxH];
    p4 = [boxX, boxY + boxH];
  }

  var transform = null;
  if (rotation !== 0) {
    var centerX = x + anchorX;
    var centerY = y + anchorY;
    transform = _ol_transform_.compose(localTransform,
        centerX, centerY, 1, 1, rotation, -centerX, -centerY);

    createOrUpdateEmpty(box);
    extendCoordinate(box, _ol_transform_.apply(localTransform, p1));
    extendCoordinate(box, _ol_transform_.apply(localTransform, p2));
    extendCoordinate(box, _ol_transform_.apply(localTransform, p3));
    extendCoordinate(box, _ol_transform_.apply(localTransform, p4));
  } else {
    createOrUpdate(boxX, boxY, boxX + boxW, boxY + boxH, box);
  }
  var canvas = context.canvas;
  var strokePadding = strokeInstruction ? (strokeInstruction[2] * scale / 2) : 0;
  var intersects =
      box[0] - strokePadding <= canvas.width && box[2] + strokePadding >= 0 &&
      box[1] - strokePadding <= canvas.height && box[3] + strokePadding >= 0;

  if (snapToPixel) {
    x = Math.round(x);
    y = Math.round(y);
  }

  if (declutterGroup) {
    if (!intersects && declutterGroup[4] == 1) {
      return;
    }
    extend(declutterGroup, box);
    var declutterArgs = intersects ?
      [context, transform ? transform.slice(0) : null, opacity, image, originX, originY, w, h, x, y, scale] :
      null;
    if (declutterArgs && fillStroke) {
      declutterArgs.push(fillInstruction, strokeInstruction, p1, p2, p3, p4);
    }
    declutterGroup.push(declutterArgs);
  } else if (intersects) {
    if (fillStroke) {
      this.replayTextBackground_(context, p1, p2, p3, p4,
          /** @type {Array.<*>} */ (fillInstruction),
          /** @type {Array.<*>} */ (strokeInstruction));
    }
    _ol_render_canvas_.drawImage(context, transform, opacity, image, originX, originY, w, h, x, y, scale);
  }
};


/**
 * @protected
 * @param {Array.<number>} dashArray Dash array.
 * @return {Array.<number>} Dash array with pixel ratio applied
 */
_ol_render_canvas_Replay_.prototype.applyPixelRatio = function(dashArray) {
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
_ol_render_canvas_Replay_.prototype.appendFlatCoordinates = function(flatCoordinates, offset, end, stride, closed, skipFirst) {

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
    nextRel = coordinateRelationship(extent, nextCoord);
    if (nextRel !== lastRel) {
      if (skipped) {
        this.coordinates[myEnd++] = lastCoord[0];
        this.coordinates[myEnd++] = lastCoord[1];
      }
      this.coordinates[myEnd++] = nextCoord[0];
      this.coordinates[myEnd++] = nextCoord[1];
      skipped = false;
    } else if (nextRel === Relationship.INTERSECTING) {
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
_ol_render_canvas_Replay_.prototype.drawCustomCoordinates_ = function(flatCoordinates, offset, ends, stride, replayEnds) {
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
_ol_render_canvas_Replay_.prototype.drawCustom = function(geometry, feature, renderer) {
  this.beginGeometry(geometry, feature);
  var type = geometry.getType();
  var stride = geometry.getStride();
  var replayBegin = this.coordinates.length;
  var flatCoordinates, replayEnd, replayEnds, replayEndss;
  var offset;
  if (type == GeometryType.MULTI_POLYGON) {
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
    this.instructions.push([_ol_render_canvas_Instruction_.CUSTOM,
      replayBegin, replayEndss, geometry, renderer, _ol_geom_flat_inflate_.coordinatesss]);
  } else if (type == GeometryType.POLYGON || type == GeometryType.MULTI_LINE_STRING) {
    replayEnds = [];
    flatCoordinates = (type == GeometryType.POLYGON) ?
      /** @type {ol.geom.Polygon} */ (geometry).getOrientedFlatCoordinates() :
      geometry.getFlatCoordinates();
    offset = this.drawCustomCoordinates_(flatCoordinates, 0,
        /** @type {ol.geom.Polygon|ol.geom.MultiLineString} */ (geometry).getEnds(),
        stride, replayEnds);
    this.instructions.push([_ol_render_canvas_Instruction_.CUSTOM,
      replayBegin, replayEnds, geometry, renderer, _ol_geom_flat_inflate_.coordinatess]);
  } else if (type == GeometryType.LINE_STRING || type == GeometryType.MULTI_POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    replayEnd = this.appendFlatCoordinates(
        flatCoordinates, 0, flatCoordinates.length, stride, false, false);
    this.instructions.push([_ol_render_canvas_Instruction_.CUSTOM,
      replayBegin, replayEnd, geometry, renderer, _ol_geom_flat_inflate_.coordinates]);
  } else if (type == GeometryType.POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    this.coordinates.push(flatCoordinates[0], flatCoordinates[1]);
    replayEnd = this.coordinates.length;
    this.instructions.push([_ol_render_canvas_Instruction_.CUSTOM,
      replayBegin, replayEnd, geometry, renderer]);
  }
  this.endGeometry(geometry, feature);
};


/**
 * @protected
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_canvas_Replay_.prototype.beginGeometry = function(geometry, feature) {
  this.beginGeometryInstruction1_ =
      [_ol_render_canvas_Instruction_.BEGIN_GEOMETRY, feature, 0];
  this.instructions.push(this.beginGeometryInstruction1_);
  this.beginGeometryInstruction2_ =
      [_ol_render_canvas_Instruction_.BEGIN_GEOMETRY, feature, 0];
  this.hitDetectionInstructions.push(this.beginGeometryInstruction2_);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 */
_ol_render_canvas_Replay_.prototype.fill_ = function(context) {
  if (this.fillOrigin_) {
    var origin = _ol_transform_.apply(this.renderedTransform_, this.fillOrigin_.slice());
    context.translate(origin[0], origin[1]);
    context.rotate(this.viewRotation_);
  }
  context.fill();
  if (this.fillOrigin_) {
    context.setTransform.apply(context, _ol_render_canvas_.resetTransform_);
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {Array.<*>} instruction Instruction.
 */
_ol_render_canvas_Replay_.prototype.setStrokeStyle_ = function(context, instruction) {
  context.strokeStyle = /** @type {ol.ColorLike} */ (instruction[1]);
  context.lineWidth = /** @type {number} */ (instruction[2]);
  context.lineCap = /** @type {string} */ (instruction[3]);
  context.lineJoin = /** @type {string} */ (instruction[4]);
  context.miterLimit = /** @type {number} */ (instruction[5]);
  if (_ol_has_.CANVAS_LINE_DASH) {
    context.lineDashOffset = /** @type {number} */ (instruction[7]);
    context.setLineDash(/** @type {Array.<number>} */ (instruction[6]));
  }
};


/**
 * @param {ol.DeclutterGroup} declutterGroup Declutter group.
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 */
_ol_render_canvas_Replay_.prototype.renderDeclutter_ = function(declutterGroup, feature) {
  if (declutterGroup && declutterGroup.length > 5) {
    var groupCount = declutterGroup[4];
    if (groupCount == 1 || groupCount == declutterGroup.length - 5) {
      /** @type {ol.RBushEntry} */
      var box = {
        minX: /** @type {number} */ (declutterGroup[0]),
        minY: /** @type {number} */ (declutterGroup[1]),
        maxX: /** @type {number} */ (declutterGroup[2]),
        maxY: /** @type {number} */ (declutterGroup[3]),
        value: feature
      };
      if (!this.declutterTree.collides(box)) {
        this.declutterTree.insert(box);
        var drawImage = _ol_render_canvas_.drawImage;
        for (var j = 5, jj = declutterGroup.length; j < jj; ++j) {
          var declutterData = /** @type {Array} */ (declutterGroup[j]);
          if (declutterData) {
            if (declutterData.length > 11) {
              this.replayTextBackground_(declutterData[0],
                  declutterData[13], declutterData[14], declutterData[15], declutterData[16],
                  declutterData[11], declutterData[12]);
            }
            drawImage.apply(undefined, declutterData);
          }
        }
      }
      declutterGroup.length = 5;
      createOrUpdateEmpty(declutterGroup);
    }
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
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
_ol_render_canvas_Replay_.prototype.replay_ = function(
    context, transform, skippedFeaturesHash,
    instructions, featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = _ol_geom_flat_transform_.transform2D(
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
    _ol_transform_.setFromArray(this.renderedTransform_, transform);
  }
  var skipFeatures = !_ol_obj_.isEmpty(skippedFeaturesHash);
  var i = 0; // instruction index
  var ii = instructions.length; // end of instructions
  var d = 0; // data index
  var dd; // end of per-instruction data
  var anchorX, anchorY, prevX, prevY, roundX, roundY, declutterGroup, image;
  var pendingFill = 0;
  var pendingStroke = 0;
  var lastFillInstruction = null;
  var lastStrokeInstruction = null;
  var coordinateCache = this.coordinateCache_;
  var viewRotation = this.viewRotation_;

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
      case _ol_render_canvas_Instruction_.BEGIN_GEOMETRY:
        feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
        if ((skipFeatures &&
            skippedFeaturesHash[getUid(feature).toString()]) ||
            !feature.getGeometry()) {
          i = /** @type {number} */ (instruction[2]);
        } else if (opt_hitExtent !== undefined && !intersects(
            opt_hitExtent, feature.getGeometry().getExtent())) {
          i = /** @type {number} */ (instruction[2]) + 1;
        } else {
          ++i;
        }
        break;
      case _ol_render_canvas_Instruction_.BEGIN_PATH:
        if (pendingFill > batchSize) {
          this.fill_(context);
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
      case _ol_render_canvas_Instruction_.CIRCLE:
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
      case _ol_render_canvas_Instruction_.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case _ol_render_canvas_Instruction_.CUSTOM:
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
      case _ol_render_canvas_Instruction_.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
            (instruction[3]);
        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        anchorX = /** @type {number} */ (instruction[4]);
        anchorY = /** @type {number} */ (instruction[5]);
        declutterGroup = featureCallback ? null : /** @type {ol.DeclutterGroup} */ (instruction[6]);
        var height = /** @type {number} */ (instruction[7]);
        var opacity = /** @type {number} */ (instruction[8]);
        var originX = /** @type {number} */ (instruction[9]);
        var originY = /** @type {number} */ (instruction[10]);
        var rotateWithView = /** @type {boolean} */ (instruction[11]);
        var rotation = /** @type {number} */ (instruction[12]);
        var scale = /** @type {number} */ (instruction[13]);
        var snapToPixel = /** @type {boolean} */ (instruction[14]);
        var width = /** @type {number} */ (instruction[15]);

        var padding, backgroundFill, backgroundStroke;
        if (instruction.length > 16) {
          padding = /** @type {Array.<number>} */ (instruction[16]);
          backgroundFill = /** @type {boolean} */ (instruction[17]);
          backgroundStroke = /** @type {boolean} */ (instruction[18]);
        } else {
          padding = _ol_render_canvas_.defaultPadding;
          backgroundFill = backgroundStroke = false;
        }

        if (rotateWithView) {
          rotation += viewRotation;
        }
        for (; d < dd; d += 2) {
          this.replayImage_(context,
              pixelCoordinates[d], pixelCoordinates[d + 1], image, anchorX, anchorY,
              declutterGroup, height, opacity, originX, originY, rotation, scale,
              snapToPixel, width, padding,
              backgroundFill ? /** @type {Array.<*>} */ (lastFillInstruction) : null,
              backgroundStroke ? /** @type {Array.<*>} */ (lastStrokeInstruction) : null);
        }
        this.renderDeclutter_(declutterGroup, feature);
        ++i;
        break;
      case _ol_render_canvas_Instruction_.DRAW_CHARS:
        var begin = /** @type {number} */ (instruction[1]);
        var end = /** @type {number} */ (instruction[2]);
        var baseline = /** @type {number} */ (instruction[3]);
        declutterGroup = featureCallback ? null : /** @type {ol.DeclutterGroup} */ (instruction[4]);
        var overflow = /** @type {number} */ (instruction[5]);
        var fillKey = /** @type {string} */ (instruction[6]);
        var maxAngle = /** @type {number} */ (instruction[7]);
        var measure = /** @type {function(string):number} */ (instruction[8]);
        var offsetY = /** @type {number} */ (instruction[9]);
        var strokeKey = /** @type {string} */ (instruction[10]);
        var strokeWidth =  /** @type {number} */ (instruction[11]);
        var text = /** @type {string} */ (instruction[12]);
        var textKey = /** @type {string} */ (instruction[13]);
        var textScale = /** @type {number} */ (instruction[14]);

        var pathLength = _ol_geom_flat_length_.lineString(pixelCoordinates, begin, end, 2);
        var textLength = measure(text);
        if (overflow || textLength <= pathLength) {
          var textAlign = /** @type {ol.render.canvas.TextReplay} */ (this).textStates[textKey].textAlign;
          var startM = (pathLength - textLength) * _ol_render_replay_.TEXT_ALIGN[textAlign];
          var parts = _ol_geom_flat_textpath_.lineString(
              pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle);
          if (parts) {
            var c, cc, chars, label, part;
            if (strokeKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, textKey, '', strokeKey);
                anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width,
                    _ol_render_canvas_.defaultPadding, null, null);
              }
            }
            if (fillKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, textKey, fillKey, '');
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width,
                    _ol_render_canvas_.defaultPadding, null, null);
              }
            }
          }
        }
        this.renderDeclutter_(declutterGroup, feature);
        ++i;
        break;
      case _ol_render_canvas_Instruction_.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
          var result = featureCallback(feature);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case _ol_render_canvas_Instruction_.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context);
        }
        ++i;
        break;
      case _ol_render_canvas_Instruction_.MOVE_TO_LINE_TO:
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
      case _ol_render_canvas_Instruction_.SET_FILL_STYLE:
        lastFillInstruction = instruction;
        this.fillOrigin_ = instruction[2];

        if (pendingFill) {
          this.fill_(context);
          pendingFill = 0;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
        }

        context.fillStyle = /** @type {ol.ColorLike} */ (instruction[1]);
        ++i;
        break;
      case _ol_render_canvas_Instruction_.SET_STROKE_STYLE:
        lastStrokeInstruction = instruction;
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        this.setStrokeStyle_(context, /** @type {Array.<*>} */ (instruction));
        ++i;
        break;
      case _ol_render_canvas_Instruction_.STROKE:
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
    this.fill_(context);
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
_ol_render_canvas_Replay_.prototype.replay = function(
    context, transform, viewRotation, skippedFeaturesHash) {
  this.viewRotation_ = viewRotation;
  this.replay_(context, transform,
      skippedFeaturesHash, this.instructions, undefined, undefined);
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
_ol_render_canvas_Replay_.prototype.replayHitDetection = function(
    context, transform, viewRotation, skippedFeaturesHash,
    opt_featureCallback, opt_hitExtent) {
  this.viewRotation_ = viewRotation;
  return this.replay_(context, transform, skippedFeaturesHash,
      this.hitDetectionInstructions, opt_featureCallback, opt_hitExtent);
};


/**
 * Reverse the hit detection instructions.
 */
_ol_render_canvas_Replay_.prototype.reverseHitDetectionInstructions = function() {
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
    if (type == _ol_render_canvas_Instruction_.END_GEOMETRY) {
      begin = i;
    } else if (type == _ol_render_canvas_Instruction_.BEGIN_GEOMETRY) {
      instruction[2] = i;
      reverseSubArray(this.hitDetectionInstructions, begin, i);
      begin = -1;
    }
  }
};


/**
 * @inheritDoc
 */
_ol_render_canvas_Replay_.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  var state = this.state;
  if (fillStyle) {
    var fillStyleColor = fillStyle.getColor();
    state.fillStyle = asColorLike(fillStyleColor ?
      fillStyleColor : _ol_render_canvas_.defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (strokeStyle) {
    var strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = asColorLike(strokeStyleColor ?
      strokeStyleColor : _ol_render_canvas_.defaultStrokeStyle);
    var strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : _ol_render_canvas_.defaultLineCap;
    var strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash.slice() : _ol_render_canvas_.defaultLineDash;
    var strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    state.lineDashOffset = strokeStyleLineDashOffset ?
      strokeStyleLineDashOffset : _ol_render_canvas_.defaultLineDashOffset;
    var strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : _ol_render_canvas_.defaultLineJoin;
    var strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : _ol_render_canvas_.defaultLineWidth;
    var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : _ol_render_canvas_.defaultMiterLimit;

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
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 * @return {Array.<*>} Fill instruction.
 */
_ol_render_canvas_Replay_.prototype.createFill = function(state, geometry) {
  var fillStyle = state.fillStyle;
  var fillInstruction = [_ol_render_canvas_Instruction_.SET_FILL_STYLE, fillStyle];
  if (typeof fillStyle !== 'string') {
    var fillExtent = geometry.getExtent();
    fillInstruction.push([fillExtent[0], fillExtent[3]]);
  }
  return fillInstruction;
};


/**
 * @param {ol.CanvasFillStrokeState} state State.
 */
_ol_render_canvas_Replay_.prototype.applyStroke = function(state) {
  this.instructions.push(this.createStroke(state));
};


/**
 * @param {ol.CanvasFillStrokeState} state State.
 * @return {Array.<*>} Stroke instruction.
 */
_ol_render_canvas_Replay_.prototype.createStroke = function(state) {
  return [
    _ol_render_canvas_Instruction_.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth * this.pixelRatio, state.lineCap,
    state.lineJoin, state.miterLimit,
    this.applyPixelRatio(state.lineDash), state.lineDashOffset * this.pixelRatio
  ];
};


/**
 * @param {ol.CanvasFillStrokeState} state State.
 * @param {function(this:ol.render.canvas.Replay, ol.CanvasFillStrokeState, (ol.geom.Geometry|ol.render.Feature)):Array.<*>} createFill Create fill.
 * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
 */
_ol_render_canvas_Replay_.prototype.updateFillStyle = function(state, createFill, geometry) {
  var fillStyle = state.fillStyle;
  if (typeof fillStyle !== 'string' || state.currentFillStyle != fillStyle) {
    if (fillStyle !== undefined) {
      this.instructions.push(createFill.call(this, state, geometry));
    }
    state.currentFillStyle = fillStyle;
  }
};


/**
 * @param {ol.CanvasFillStrokeState} state State.
 * @param {function(this:ol.render.canvas.Replay, ol.CanvasFillStrokeState)} applyStroke Apply stroke.
 */
_ol_render_canvas_Replay_.prototype.updateStrokeStyle = function(state, applyStroke) {
  var strokeStyle = state.strokeStyle;
  var lineCap = state.lineCap;
  var lineDash = state.lineDash;
  var lineDashOffset = state.lineDashOffset;
  var lineJoin = state.lineJoin;
  var lineWidth = state.lineWidth;
  var miterLimit = state.miterLimit;
  if (state.currentStrokeStyle != strokeStyle ||
      state.currentLineCap != lineCap ||
      (lineDash != state.currentLineDash && !equals(state.currentLineDash, lineDash)) ||
      state.currentLineDashOffset != lineDashOffset ||
      state.currentLineJoin != lineJoin ||
      state.currentLineWidth != lineWidth ||
      state.currentMiterLimit != miterLimit) {
    if (strokeStyle !== undefined) {
      applyStroke.call(this, state);
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
_ol_render_canvas_Replay_.prototype.endGeometry = function(geometry, feature) {
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
  this.beginGeometryInstruction2_[2] = this.hitDetectionInstructions.length;
  this.beginGeometryInstruction2_ = null;
  var endGeometryInstruction =
      [_ol_render_canvas_Instruction_.END_GEOMETRY, feature];
  this.instructions.push(endGeometryInstruction);
  this.hitDetectionInstructions.push(endGeometryInstruction);
};


/**
 * FIXME empty description for jsdoc
 */
_ol_render_canvas_Replay_.prototype.finish = nullFunction;


/**
 * Get the buffered rendering extent.  Rendering will be clipped to the extent
 * provided to the constructor.  To account for symbolizers that may intersect
 * this extent, we calculate a buffered extent (e.g. based on stroke width).
 * @return {ol.Extent} The buffered rendering extent.
 * @protected
 */
_ol_render_canvas_Replay_.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      var width = this.resolution * (this.maxLineWidth + 1) / 2;
      buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};
export default _ol_render_canvas_Replay_;
