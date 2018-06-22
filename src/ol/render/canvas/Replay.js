/**
 * @module ol/render/canvas/Replay
 */
import {getUid, inherits} from '../../util.js';
import {UNDEFINED} from '../../functions.js';
import {equals, reverseSubArray} from '../../array.js';
import {asColorLike} from '../../colorlike.js';
import {buffer, clone, coordinateRelationship, createEmpty, createOrUpdate,
  createOrUpdateEmpty, extend, extendCoordinate, intersects} from '../../extent.js';
import Relationship from '../../extent/Relationship.js';
import GeometryType from '../../geom/GeometryType.js';
import {inflateCoordinates, inflateCoordinatesArray, inflateMultiCoordinatesArray} from '../../geom/flat/inflate.js';
import {lineStringLength} from '../../geom/flat/length.js';
import {drawTextOnPath} from '../../geom/flat/textpath.js';
import {transform2D} from '../../geom/flat/transform.js';
import {CANVAS_LINE_DASH} from '../../has.js';
import {isEmpty} from '../../obj.js';
import VectorContext from '../VectorContext.js';
import {drawImage, resetTransform, defaultPadding, defaultFillStyle, defaultStrokeStyle,
  defaultMiterLimit, defaultLineWidth, defaultLineJoin, defaultLineDashOffset,
  defaultLineDash, defaultLineCap} from '../canvas.js';
import CanvasInstruction from '../canvas/Instruction.js';
import {TEXT_ALIGN} from '../replay.js';
import {
  create as createTransform,
  compose as composeTransform,
  apply as applyTransform,
  setFromArray as transformSetFromArray
} from '../../transform.js';

/**
 * @constructor
 * @extends {module:ol/render/VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {module:ol/extent~Extent} maxExtent Maximum extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {boolean} overlaps The replay can have overlapping geometries.
 * @param {?} declutterTree Declutter tree.
 * @struct
 */
const CanvasReplay = function(tolerance, maxExtent, resolution, pixelRatio, overlaps, declutterTree) {
  VectorContext.call(this);

  /**
   * @type {?}
   */
  this.declutterTree = declutterTree;

  /**
   * @protected
   * @type {number}
   */
  this.tolerance = tolerance;

  /**
   * @protected
   * @const
   * @type {module:ol/extent~Extent}
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
   * @type {boolean}
   */
  this.alignFill_;

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
   * @type {module:ol/extent~Extent}
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
   * @type {!Object.<number,module:ol/coordinate~Coordinate|Array.<module:ol/coordinate~Coordinate>|Array.<Array.<module:ol/coordinate~Coordinate>>>}
   */
  this.coordinateCache_ = {};

  /**
   * @private
   * @type {!module:ol/transform~Transform}
   */
  this.renderedTransform_ = createTransform();

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
   * @type {module:ol/render/canvas~FillStrokeState}
   */
  this.state = /** @type {module:ol/render/canvas~FillStrokeState} */ ({});

  /**
   * @private
   * @type {number}
   */
  this.viewRotation_ = 0;

};

inherits(CanvasReplay, VectorContext);


/**
 * @type {module:ol/extent~Extent}
 */
const tmpExtent = createEmpty();


/**
 * @type {!module:ol/transform~Transform}
 */
const tmpTransform = createTransform();

/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {module:ol/coordinate~Coordinate} p1 1st point of the background box.
 * @param {module:ol/coordinate~Coordinate} p2 2nd point of the background box.
 * @param {module:ol/coordinate~Coordinate} p3 3rd point of the background box.
 * @param {module:ol/coordinate~Coordinate} p4 4th point of the background box.
 * @param {Array.<*>} fillInstruction Fill instruction.
 * @param {Array.<*>} strokeInstruction Stroke instruction.
 */
CanvasReplay.prototype.replayTextBackground_ = function(context, p1, p2, p3, p4,
  fillInstruction, strokeInstruction) {
  context.beginPath();
  context.moveTo.apply(context, p1);
  context.lineTo.apply(context, p2);
  context.lineTo.apply(context, p3);
  context.lineTo.apply(context, p4);
  context.lineTo.apply(context, p1);
  if (fillInstruction) {
    this.alignFill_ = /** @type {boolean} */ (fillInstruction[2]);
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
 * @param {module:ol/render/canvas~DeclutterGroup} declutterGroup Declutter group.
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
CanvasReplay.prototype.replayImage_ = function(context, x, y, image,
  anchorX, anchorY, declutterGroup, height, opacity, originX, originY,
  rotation, scale, snapToPixel, width, padding, fillInstruction, strokeInstruction) {
  const fillStroke = fillInstruction || strokeInstruction;
  anchorX *= scale;
  anchorY *= scale;
  x -= anchorX;
  y -= anchorY;

  const w = (width + originX > image.width) ? image.width - originX : width;
  const h = (height + originY > image.height) ? image.height - originY : height;
  const boxW = padding[3] + w * scale + padding[1];
  const boxH = padding[0] + h * scale + padding[2];
  const boxX = x - padding[3];
  const boxY = y - padding[0];

  /** @type {module:ol/coordinate~Coordinate} */
  let p1;
  /** @type {module:ol/coordinate~Coordinate} */
  let p2;
  /** @type {module:ol/coordinate~Coordinate} */
  let p3;
  /** @type {module:ol/coordinate~Coordinate} */
  let p4;
  if (fillStroke || rotation !== 0) {
    p1 = [boxX, boxY];
    p2 = [boxX + boxW, boxY];
    p3 = [boxX + boxW, boxY + boxH];
    p4 = [boxX, boxY + boxH];
  }

  let transform = null;
  if (rotation !== 0) {
    const centerX = x + anchorX;
    const centerY = y + anchorY;
    transform = composeTransform(tmpTransform, centerX, centerY, 1, 1, rotation, -centerX, -centerY);

    createOrUpdateEmpty(tmpExtent);
    extendCoordinate(tmpExtent, applyTransform(tmpTransform, p1));
    extendCoordinate(tmpExtent, applyTransform(tmpTransform, p2));
    extendCoordinate(tmpExtent, applyTransform(tmpTransform, p3));
    extendCoordinate(tmpExtent, applyTransform(tmpTransform, p4));
  } else {
    createOrUpdate(boxX, boxY, boxX + boxW, boxY + boxH, tmpExtent);
  }
  const canvas = context.canvas;
  const strokePadding = strokeInstruction ? (strokeInstruction[2] * scale / 2) : 0;
  const intersects =
      tmpExtent[0] - strokePadding <= canvas.width && tmpExtent[2] + strokePadding >= 0 &&
      tmpExtent[1] - strokePadding <= canvas.height && tmpExtent[3] + strokePadding >= 0;

  if (snapToPixel) {
    x = Math.round(x);
    y = Math.round(y);
  }

  if (declutterGroup) {
    if (!intersects && declutterGroup[4] == 1) {
      return;
    }
    extend(declutterGroup, tmpExtent);
    const declutterArgs = intersects ?
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
    drawImage(context, transform, opacity, image, originX, originY, w, h, x, y, scale);
  }
};


/**
 * @protected
 * @param {Array.<number>} dashArray Dash array.
 * @return {Array.<number>} Dash array with pixel ratio applied
 */
CanvasReplay.prototype.applyPixelRatio = function(dashArray) {
  const pixelRatio = this.pixelRatio;
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
CanvasReplay.prototype.appendFlatCoordinates = function(flatCoordinates, offset, end, stride, closed, skipFirst) {

  let myEnd = this.coordinates.length;
  const extent = this.getBufferedMaxExtent();
  if (skipFirst) {
    offset += stride;
  }
  const lastCoord = [flatCoordinates[offset], flatCoordinates[offset + 1]];
  const nextCoord = [NaN, NaN];
  let skipped = true;

  let i, lastRel, nextRel;
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
CanvasReplay.prototype.drawCustomCoordinates_ = function(flatCoordinates, offset, ends, stride, replayEnds) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    const replayEnd = this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false, false);
    replayEnds.push(replayEnd);
    offset = end;
  }
  return offset;
};


/**
 * @inheritDoc.
 */
CanvasReplay.prototype.drawCustom = function(geometry, feature, renderer) {
  this.beginGeometry(geometry, feature);
  const type = geometry.getType();
  const stride = geometry.getStride();
  const replayBegin = this.coordinates.length;
  let flatCoordinates, replayEnd, replayEnds, replayEndss;
  let offset;
  if (type == GeometryType.MULTI_POLYGON) {
    geometry = /** @type {module:ol/geom/MultiPolygon} */ (geometry);
    flatCoordinates = geometry.getOrientedFlatCoordinates();
    replayEndss = [];
    const endss = geometry.getEndss();
    offset = 0;
    for (let i = 0, ii = endss.length; i < ii; ++i) {
      const myEnds = [];
      offset = this.drawCustomCoordinates_(flatCoordinates, offset, endss[i], stride, myEnds);
      replayEndss.push(myEnds);
    }
    this.instructions.push([CanvasInstruction.CUSTOM,
      replayBegin, replayEndss, geometry, renderer, inflateMultiCoordinatesArray]);
  } else if (type == GeometryType.POLYGON || type == GeometryType.MULTI_LINE_STRING) {
    replayEnds = [];
    flatCoordinates = (type == GeometryType.POLYGON) ?
      /** @type {module:ol/geom/Polygon} */ (geometry).getOrientedFlatCoordinates() :
      geometry.getFlatCoordinates();
    offset = this.drawCustomCoordinates_(flatCoordinates, 0,
      /** @type {module:ol/geom/Polygon|module:ol/geom/MultiLineString} */ (geometry).getEnds(),
      stride, replayEnds);
    this.instructions.push([CanvasInstruction.CUSTOM,
      replayBegin, replayEnds, geometry, renderer, inflateCoordinatesArray]);
  } else if (type == GeometryType.LINE_STRING || type == GeometryType.MULTI_POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    replayEnd = this.appendFlatCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride, false, false);
    this.instructions.push([CanvasInstruction.CUSTOM,
      replayBegin, replayEnd, geometry, renderer, inflateCoordinates]);
  } else if (type == GeometryType.POINT) {
    flatCoordinates = geometry.getFlatCoordinates();
    this.coordinates.push(flatCoordinates[0], flatCoordinates[1]);
    replayEnd = this.coordinates.length;
    this.instructions.push([CanvasInstruction.CUSTOM,
      replayBegin, replayEnd, geometry, renderer]);
  }
  this.endGeometry(geometry, feature);
};


/**
 * @protected
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
 * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
 */
CanvasReplay.prototype.beginGeometry = function(geometry, feature) {
  this.beginGeometryInstruction1_ = [CanvasInstruction.BEGIN_GEOMETRY, feature, 0];
  this.instructions.push(this.beginGeometryInstruction1_);
  this.beginGeometryInstruction2_ = [CanvasInstruction.BEGIN_GEOMETRY, feature, 0];
  this.hitDetectionInstructions.push(this.beginGeometryInstruction2_);
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 */
CanvasReplay.prototype.fill_ = function(context) {
  if (this.alignFill_) {
    const origin = applyTransform(this.renderedTransform_, [0, 0]);
    const repeatSize = 512 * this.pixelRatio;
    context.translate(origin[0] % repeatSize, origin[1] % repeatSize);
    context.rotate(this.viewRotation_);
  }
  context.fill();
  if (this.alignFill_) {
    context.setTransform.apply(context, resetTransform);
  }
};


/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {Array.<*>} instruction Instruction.
 */
CanvasReplay.prototype.setStrokeStyle_ = function(context, instruction) {
  context.strokeStyle = /** @type {module:ol/colorlike~ColorLike} */ (instruction[1]);
  context.lineWidth = /** @type {number} */ (instruction[2]);
  context.lineCap = /** @type {string} */ (instruction[3]);
  context.lineJoin = /** @type {string} */ (instruction[4]);
  context.miterLimit = /** @type {number} */ (instruction[5]);
  if (CANVAS_LINE_DASH) {
    context.lineDashOffset = /** @type {number} */ (instruction[7]);
    context.setLineDash(/** @type {Array.<number>} */ (instruction[6]));
  }
};


/**
 * @param {module:ol/render/canvas~DeclutterGroup} declutterGroup Declutter group.
 * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
 */
CanvasReplay.prototype.renderDeclutter_ = function(declutterGroup, feature) {
  if (declutterGroup && declutterGroup.length > 5) {
    const groupCount = declutterGroup[4];
    if (groupCount == 1 || groupCount == declutterGroup.length - 5) {
      /** @type {module:ol/structs/RBush~Entry} */
      const box = {
        minX: /** @type {number} */ (declutterGroup[0]),
        minY: /** @type {number} */ (declutterGroup[1]),
        maxX: /** @type {number} */ (declutterGroup[2]),
        maxY: /** @type {number} */ (declutterGroup[3]),
        value: feature
      };
      if (!this.declutterTree.collides(box)) {
        this.declutterTree.insert(box);
        for (let j = 5, jj = declutterGroup.length; j < jj; ++j) {
          const declutterData = /** @type {Array} */ (declutterGroup[j]);
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
 * @param {module:ol/transform~Transform} transform Transform.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<*>} instructions Instructions array.
 * @param {function((module:ol/Feature|module:ol/render/Feature)): T|undefined}
 *     featureCallback Feature callback.
 * @param {module:ol/extent~Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
CanvasReplay.prototype.replay_ = function(
  context, transform, skippedFeaturesHash,
  instructions, featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  let pixelCoordinates;
  if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = transform2D(
      this.coordinates, 0, this.coordinates.length, 2,
      transform, this.pixelCoordinates_);
    transformSetFromArray(this.renderedTransform_, transform);
  }
  const skipFeatures = !isEmpty(skippedFeaturesHash);
  let i = 0; // instruction index
  const ii = instructions.length; // end of instructions
  let d = 0; // data index
  let dd; // end of per-instruction data
  let anchorX, anchorY, prevX, prevY, roundX, roundY, declutterGroup, image;
  let pendingFill = 0;
  let pendingStroke = 0;
  let lastFillInstruction = null;
  let lastStrokeInstruction = null;
  const coordinateCache = this.coordinateCache_;
  const viewRotation = this.viewRotation_;

  const state = /** @type {module:ol/render~State} */ ({
    context: context,
    pixelRatio: this.pixelRatio,
    resolution: this.resolution,
    rotation: viewRotation
  });

  // When the batch size gets too big, performance decreases. 200 is a good
  // balance between batch size and number of fill/stroke instructions.
  const batchSize = this.instructions != instructions || this.overlaps ? 0 : 200;
  let /** @type {module:ol/Feature|module:ol/render/Feature} */ feature;
  let x, y;
  while (i < ii) {
    const instruction = instructions[i];
    const type = /** @type {module:ol/render/canvas/Instruction} */ (instruction[0]);
    switch (type) {
      case CanvasInstruction.BEGIN_GEOMETRY:
        feature = /** @type {module:ol/Feature|module:ol/render/Feature} */ (instruction[1]);
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
      case CanvasInstruction.BEGIN_PATH:
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
      case CanvasInstruction.CIRCLE:
        d = /** @type {number} */ (instruction[1]);
        const x1 = pixelCoordinates[d];
        const y1 = pixelCoordinates[d + 1];
        const x2 = pixelCoordinates[d + 2];
        const y2 = pixelCoordinates[d + 3];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);
        context.moveTo(x1 + r, y1);
        context.arc(x1, y1, r, 0, 2 * Math.PI, true);
        ++i;
        break;
      case CanvasInstruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case CanvasInstruction.CUSTOM:
        d = /** @type {number} */ (instruction[1]);
        dd = instruction[2];
        const geometry = /** @type {module:ol/geom/SimpleGeometry} */ (instruction[3]);
        const renderer = instruction[4];
        const fn = instruction.length == 6 ? instruction[5] : undefined;
        state.geometry = geometry;
        state.feature = feature;
        if (!(i in coordinateCache)) {
          coordinateCache[i] = [];
        }
        const coords = coordinateCache[i];
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
      case CanvasInstruction.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
            (instruction[3]);
        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        anchorX = /** @type {number} */ (instruction[4]);
        anchorY = /** @type {number} */ (instruction[5]);
        declutterGroup = featureCallback ? null : /** @type {module:ol/render/canvas~DeclutterGroup} */ (instruction[6]);
        const height = /** @type {number} */ (instruction[7]);
        const opacity = /** @type {number} */ (instruction[8]);
        const originX = /** @type {number} */ (instruction[9]);
        const originY = /** @type {number} */ (instruction[10]);
        const rotateWithView = /** @type {boolean} */ (instruction[11]);
        let rotation = /** @type {number} */ (instruction[12]);
        const scale = /** @type {number} */ (instruction[13]);
        const snapToPixel = /** @type {boolean} */ (instruction[14]);
        const width = /** @type {number} */ (instruction[15]);

        let padding, backgroundFill, backgroundStroke;
        if (instruction.length > 16) {
          padding = /** @type {Array.<number>} */ (instruction[16]);
          backgroundFill = /** @type {boolean} */ (instruction[17]);
          backgroundStroke = /** @type {boolean} */ (instruction[18]);
        } else {
          padding = defaultPadding;
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
      case CanvasInstruction.DRAW_CHARS:
        const begin = /** @type {number} */ (instruction[1]);
        const end = /** @type {number} */ (instruction[2]);
        const baseline = /** @type {number} */ (instruction[3]);
        declutterGroup = featureCallback ? null : /** @type {module:ol/render/canvas~DeclutterGroup} */ (instruction[4]);
        const overflow = /** @type {number} */ (instruction[5]);
        const fillKey = /** @type {string} */ (instruction[6]);
        const maxAngle = /** @type {number} */ (instruction[7]);
        const measure = /** @type {function(string):number} */ (instruction[8]);
        const offsetY = /** @type {number} */ (instruction[9]);
        const strokeKey = /** @type {string} */ (instruction[10]);
        const strokeWidth =  /** @type {number} */ (instruction[11]);
        const text = /** @type {string} */ (instruction[12]);
        const textKey = /** @type {string} */ (instruction[13]);
        const textScale = /** @type {number} */ (instruction[14]);

        const pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
        const textLength = measure(text);
        if (overflow || textLength <= pathLength) {
          const textAlign = /** @type {module:ol~render} */ (this).textStates[textKey].textAlign;
          const startM = (pathLength - textLength) * TEXT_ALIGN[textAlign];
          const parts = drawTextOnPath(
            pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle);
          if (parts) {
            let c, cc, chars, label, part;
            if (strokeKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {module:ol~render} */ (this).getImage(chars, textKey, '', strokeKey);
                anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                this.replayImage_(context,
                  /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                  anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                  /** @type {number} */ (part[3]), textScale, false, label.width,
                  defaultPadding, null, null);
              }
            }
            if (fillKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {module:ol~render} */ (this).getImage(chars, textKey, fillKey, '');
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                this.replayImage_(context,
                  /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                  anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                  /** @type {number} */ (part[3]), textScale, false, label.width,
                  defaultPadding, null, null);
              }
            }
          }
        }
        this.renderDeclutter_(declutterGroup, feature);
        ++i;
        break;
      case CanvasInstruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {module:ol/Feature|module:ol/render/Feature} */ (instruction[1]);
          const result = featureCallback(feature);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case CanvasInstruction.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context);
        }
        ++i;
        break;
      case CanvasInstruction.MOVE_TO_LINE_TO:
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
      case CanvasInstruction.SET_FILL_STYLE:
        lastFillInstruction = instruction;
        this.alignFill_ = instruction[2];

        if (pendingFill) {
          this.fill_(context);
          pendingFill = 0;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
        }

        context.fillStyle = /** @type {module:ol/colorlike~ColorLike} */ (instruction[1]);
        ++i;
        break;
      case CanvasInstruction.SET_STROKE_STYLE:
        lastStrokeInstruction = instruction;
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        this.setStrokeStyle_(context, /** @type {Array.<*>} */ (instruction));
        ++i;
        break;
      case CanvasInstruction.STROKE:
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
 * @param {module:ol/transform~Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 */
CanvasReplay.prototype.replay = function(
  context, transform, viewRotation, skippedFeaturesHash) {
  this.viewRotation_ = viewRotation;
  this.replay_(context, transform,
    skippedFeaturesHash, this.instructions, undefined, undefined);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {module:ol/transform~Transform} transform Transform.
 * @param {number} viewRotation View rotation.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {function((module:ol/Feature|module:ol/render/Feature)): T=} opt_featureCallback
 *     Feature callback.
 * @param {module:ol/extent~Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 */
CanvasReplay.prototype.replayHitDetection = function(
  context, transform, viewRotation, skippedFeaturesHash,
  opt_featureCallback, opt_hitExtent) {
  this.viewRotation_ = viewRotation;
  return this.replay_(context, transform, skippedFeaturesHash,
    this.hitDetectionInstructions, opt_featureCallback, opt_hitExtent);
};


/**
 * Reverse the hit detection instructions.
 */
CanvasReplay.prototype.reverseHitDetectionInstructions = function() {
  const hitDetectionInstructions = this.hitDetectionInstructions;
  // step 1 - reverse array
  hitDetectionInstructions.reverse();
  // step 2 - reverse instructions within geometry blocks
  let i;
  const n = hitDetectionInstructions.length;
  let instruction;
  let type;
  let begin = -1;
  for (i = 0; i < n; ++i) {
    instruction = hitDetectionInstructions[i];
    type = /** @type {module:ol/render/canvas/Instruction} */ (instruction[0]);
    if (type == CanvasInstruction.END_GEOMETRY) {
      begin = i;
    } else if (type == CanvasInstruction.BEGIN_GEOMETRY) {
      instruction[2] = i;
      reverseSubArray(this.hitDetectionInstructions, begin, i);
      begin = -1;
    }
  }
};


/**
 * @inheritDoc
 */
CanvasReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  const state = this.state;
  if (fillStyle) {
    const fillStyleColor = fillStyle.getColor();
    state.fillStyle = asColorLike(fillStyleColor ?
      fillStyleColor : defaultFillStyle);
  } else {
    state.fillStyle = undefined;
  }
  if (strokeStyle) {
    const strokeStyleColor = strokeStyle.getColor();
    state.strokeStyle = asColorLike(strokeStyleColor ?
      strokeStyleColor : defaultStrokeStyle);
    const strokeStyleLineCap = strokeStyle.getLineCap();
    state.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : defaultLineCap;
    const strokeStyleLineDash = strokeStyle.getLineDash();
    state.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash.slice() : defaultLineDash;
    const strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    state.lineDashOffset = strokeStyleLineDashOffset ?
      strokeStyleLineDashOffset : defaultLineDashOffset;
    const strokeStyleLineJoin = strokeStyle.getLineJoin();
    state.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : defaultLineJoin;
    const strokeStyleWidth = strokeStyle.getWidth();
    state.lineWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : defaultLineWidth;
    const strokeStyleMiterLimit = strokeStyle.getMiterLimit();
    state.miterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : defaultMiterLimit;

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
 * @param {module:ol/render/canvas~FillStrokeState} state State.
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
 * @return {Array.<*>} Fill instruction.
 */
CanvasReplay.prototype.createFill = function(state, geometry) {
  const fillStyle = state.fillStyle;
  const fillInstruction = [CanvasInstruction.SET_FILL_STYLE, fillStyle];
  if (typeof fillStyle !== 'string') {
    // Fill is a pattern or gradient - align it!
    fillInstruction.push(true);
  }
  return fillInstruction;
};


/**
 * @param {module:ol/render/canvas~FillStrokeState} state State.
 */
CanvasReplay.prototype.applyStroke = function(state) {
  this.instructions.push(this.createStroke(state));
};


/**
 * @param {module:ol/render/canvas~FillStrokeState} state State.
 * @return {Array.<*>} Stroke instruction.
 */
CanvasReplay.prototype.createStroke = function(state) {
  return [
    CanvasInstruction.SET_STROKE_STYLE,
    state.strokeStyle, state.lineWidth * this.pixelRatio, state.lineCap,
    state.lineJoin, state.miterLimit,
    this.applyPixelRatio(state.lineDash), state.lineDashOffset * this.pixelRatio
  ];
};


/**
 * @param {module:ol/render/canvas~FillStrokeState} state State.
 * @param {function(this:module:ol/render/canvas/Replay, module:ol/render/canvas~FillStrokeState, (module:ol/geom/Geometry|module:ol/render/Feature)):Array.<*>} createFill Create fill.
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
 */
CanvasReplay.prototype.updateFillStyle = function(state, createFill, geometry) {
  const fillStyle = state.fillStyle;
  if (typeof fillStyle !== 'string' || state.currentFillStyle != fillStyle) {
    if (fillStyle !== undefined) {
      this.instructions.push(createFill.call(this, state, geometry));
    }
    state.currentFillStyle = fillStyle;
  }
};


/**
 * @param {module:ol/render/canvas~FillStrokeState} state State.
 * @param {function(this:module:ol/render/canvas/Replay, module:ol/render/canvas~FillStrokeState)} applyStroke Apply stroke.
 */
CanvasReplay.prototype.updateStrokeStyle = function(state, applyStroke) {
  const strokeStyle = state.strokeStyle;
  const lineCap = state.lineCap;
  const lineDash = state.lineDash;
  const lineDashOffset = state.lineDashOffset;
  const lineJoin = state.lineJoin;
  const lineWidth = state.lineWidth;
  const miterLimit = state.miterLimit;
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
 * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
 * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
 */
CanvasReplay.prototype.endGeometry = function(geometry, feature) {
  this.beginGeometryInstruction1_[2] = this.instructions.length;
  this.beginGeometryInstruction1_ = null;
  this.beginGeometryInstruction2_[2] = this.hitDetectionInstructions.length;
  this.beginGeometryInstruction2_ = null;
  const endGeometryInstruction = [CanvasInstruction.END_GEOMETRY, feature];
  this.instructions.push(endGeometryInstruction);
  this.hitDetectionInstructions.push(endGeometryInstruction);
};


/**
 * FIXME empty description for jsdoc
 */
CanvasReplay.prototype.finish = UNDEFINED;


/**
 * Get the buffered rendering extent.  Rendering will be clipped to the extent
 * provided to the constructor.  To account for symbolizers that may intersect
 * this extent, we calculate a buffered extent (e.g. based on stroke width).
 * @return {module:ol/extent~Extent} The buffered rendering extent.
 * @protected
 */
CanvasReplay.prototype.getBufferedMaxExtent = function() {
  if (!this.bufferedMaxExtent_) {
    this.bufferedMaxExtent_ = clone(this.maxExtent);
    if (this.maxLineWidth > 0) {
      const width = this.resolution * (this.maxLineWidth + 1) / 2;
      buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
    }
  }
  return this.bufferedMaxExtent_;
};
export default CanvasReplay;
