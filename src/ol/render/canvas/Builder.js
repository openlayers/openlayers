/**
 * @module ol/render/canvas/Builder
 */
import {equals, reverseSubArray} from '../../array.js';
import {asColorLike} from '../../colorlike.js';
import {buffer, clone, coordinateRelationship} from '../../extent.js';
import Relationship from '../../extent/Relationship.js';
import GeometryType from '../../geom/GeometryType.js';
import {inflateCoordinates, inflateCoordinatesArray, inflateMultiCoordinatesArray} from '../../geom/flat/inflate.js';
import VectorContext from '../VectorContext.js';
import {defaultFillStyle, defaultStrokeStyle,
  defaultMiterLimit, defaultLineWidth, defaultLineJoin, defaultLineDashOffset,
  defaultLineDash, defaultLineCap} from '../canvas.js';
import CanvasInstruction from './Instruction.js';


/**
 * @typedef {Object} SerializableInstructions
 * @property {Array<*>} instructions The rendering instructions.
 * @property {Array<*>} hitDetectionInstructions The rendering hit detection instructions.
 * @property {Array<number>} coordinates The array of all coordinates.
 * @property {!Object<string, import("../canvas.js").TextState>} [textStates] The text states (decluttering).
 * @property {!Object<string, import("../canvas.js").FillState>} [fillStates] The fill states (decluttering).
 * @property {!Object<string, import("../canvas.js").StrokeState>} [strokeStates] The stroke states (decluttering).
 */


class CanvasBuilder extends VectorContext {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Maximum extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   */
  constructor(tolerance, maxExtent, resolution, pixelRatio) {
    super();

    /**
     * @protected
     * @type {number}
     */
    this.tolerance = tolerance;

    /**
     * @protected
     * @const
     * @type {import("../../extent.js").Extent}
     */
    this.maxExtent = maxExtent;

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
     * @type {Array<*>}
     */
    this.beginGeometryInstruction1_ = null;

    /**
     * @private
     * @type {Array<*>}
     */
    this.beginGeometryInstruction2_ = null;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.bufferedMaxExtent_ = null;

    /**
     * @protected
     * @type {Array<*>}
     */
    this.instructions = [];

    /**
     * @protected
     * @type {Array<number>}
     */
    this.coordinates = [];

    /**
     * @private
     * @type {import("../../coordinate.js").Coordinate}
     */
    this.tmpCoordinate_ = [];

    /**
     * @protected
     * @type {Array<*>}
     */
    this.hitDetectionInstructions = [];

    /**
     * @protected
     * @type {import("../canvas.js").FillStrokeState}
     */
    this.state = /** @type {import("../canvas.js").FillStrokeState} */ ({});

  }

  /**
   * @protected
   * @param {Array<number>} dashArray Dash array.
   * @return {Array<number>} Dash array with pixel ratio applied
   */
  applyPixelRatio(dashArray) {
    const pixelRatio = this.pixelRatio;
    return pixelRatio == 1 ? dashArray : dashArray.map(function(dash) {
      return dash * pixelRatio;
    });
  }

  /**
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @param {boolean} closed Last input coordinate equals first.
   * @param {boolean} skipFirst Skip first coordinate.
   * @protected
   * @return {number} My end.
   */
  appendFlatCoordinates(flatCoordinates, offset, end, stride, closed, skipFirst) {

    let myEnd = this.coordinates.length;
    const extent = this.getBufferedMaxExtent();
    if (skipFirst) {
      offset += stride;
    }
    let lastXCoord = flatCoordinates[offset];
    let lastYCoord = flatCoordinates[offset + 1];
    const nextCoord = this.tmpCoordinate_;
    let skipped = true;

    let i, lastRel, nextRel;
    for (i = offset + stride; i < end; i += stride) {
      nextCoord[0] = flatCoordinates[i];
      nextCoord[1] = flatCoordinates[i + 1];
      nextRel = coordinateRelationship(extent, nextCoord);
      if (nextRel !== lastRel) {
        if (skipped) {
          this.coordinates[myEnd++] = lastXCoord;
          this.coordinates[myEnd++] = lastYCoord;
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
      lastXCoord = nextCoord[0];
      lastYCoord = nextCoord[1];
      lastRel = nextRel;
    }

    // Last coordinate equals first or only one point to append:
    if ((closed && skipped) || i === offset + stride) {
      this.coordinates[myEnd++] = lastXCoord;
      this.coordinates[myEnd++] = lastYCoord;
    }
    return myEnd;
  }

  /**
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {Array<number>} ends Ends.
   * @param {number} stride Stride.
   * @param {Array<number>} builderEnds Builder ends.
   * @return {number} Offset.
   */
  drawCustomCoordinates_(flatCoordinates, offset, ends, stride, builderEnds) {
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const builderEnd = this.appendFlatCoordinates(flatCoordinates, offset, end, stride, false, false);
      builderEnds.push(builderEnd);
      offset = end;
    }
    return offset;
  }

  /**
   * @inheritDoc.
   */
  drawCustom(geometry, feature, renderer) {
    this.beginGeometry(feature);
    const type = geometry.getType();
    const stride = geometry.getStride();
    const builderBegin = this.coordinates.length;
    let flatCoordinates, builderEnd, builderEnds, builderEndss;
    let offset;
    if (type == GeometryType.MULTI_POLYGON) {
      geometry = /** @type {import("../../geom/MultiPolygon.js").default} */ (geometry);
      flatCoordinates = geometry.getOrientedFlatCoordinates();
      builderEndss = [];
      const endss = geometry.getEndss();
      offset = 0;
      for (let i = 0, ii = endss.length; i < ii; ++i) {
        const myEnds = [];
        offset = this.drawCustomCoordinates_(flatCoordinates, offset, endss[i], stride, myEnds);
        builderEndss.push(myEnds);
      }
      this.instructions.push([CanvasInstruction.CUSTOM,
        builderBegin, builderEndss, geometry, renderer, inflateMultiCoordinatesArray]);
    } else if (type == GeometryType.POLYGON || type == GeometryType.MULTI_LINE_STRING) {
      builderEnds = [];
      flatCoordinates = (type == GeometryType.POLYGON) ?
        /** @type {import("../../geom/Polygon.js").default} */ (geometry).getOrientedFlatCoordinates() :
        geometry.getFlatCoordinates();
      offset = this.drawCustomCoordinates_(flatCoordinates, 0,
        /** @type {import("../../geom/Polygon.js").default|import("../../geom/MultiLineString.js").default} */ (geometry).getEnds(),
        stride, builderEnds);
      this.instructions.push([CanvasInstruction.CUSTOM,
        builderBegin, builderEnds, geometry, renderer, inflateCoordinatesArray]);
    } else if (type == GeometryType.LINE_STRING || type == GeometryType.MULTI_POINT) {
      flatCoordinates = geometry.getFlatCoordinates();
      builderEnd = this.appendFlatCoordinates(
        flatCoordinates, 0, flatCoordinates.length, stride, false, false);
      this.instructions.push([CanvasInstruction.CUSTOM,
        builderBegin, builderEnd, geometry, renderer, inflateCoordinates]);
    } else if (type == GeometryType.POINT) {
      flatCoordinates = geometry.getFlatCoordinates();
      this.coordinates.push(flatCoordinates[0], flatCoordinates[1]);
      builderEnd = this.coordinates.length;
      this.instructions.push([CanvasInstruction.CUSTOM,
        builderBegin, builderEnd, geometry, renderer]);
    }
    this.endGeometry(feature);
  }

  /**
   * @protected
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   */
  beginGeometry(feature) {
    this.beginGeometryInstruction1_ = [CanvasInstruction.BEGIN_GEOMETRY, feature, 0];
    this.instructions.push(this.beginGeometryInstruction1_);
    this.beginGeometryInstruction2_ = [CanvasInstruction.BEGIN_GEOMETRY, feature, 0];
    this.hitDetectionInstructions.push(this.beginGeometryInstruction2_);
  }

  /**
   * @return {SerializableInstructions} the serializable instructions.
   */
  finish() {
    return {
      instructions: this.instructions,
      hitDetectionInstructions: this.hitDetectionInstructions,
      coordinates: this.coordinates
    };
  }

  /**
   * Reverse the hit detection instructions.
   */
  reverseHitDetectionInstructions() {
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
      type = /** @type {CanvasInstruction} */ (instruction[0]);
      if (type == CanvasInstruction.END_GEOMETRY) {
        begin = i;
      } else if (type == CanvasInstruction.BEGIN_GEOMETRY) {
        instruction[2] = i;
        reverseSubArray(this.hitDetectionInstructions, begin, i);
        begin = -1;
      }
    }
  }

  /**
   * @inheritDoc
   */
  setFillStrokeStyle(fillStyle, strokeStyle) {
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
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   * @return {Array<*>} Fill instruction.
   */
  createFill(state) {
    const fillStyle = state.fillStyle;
    /** @type {Array<*>} */
    const fillInstruction = [CanvasInstruction.SET_FILL_STYLE, fillStyle];
    if (typeof fillStyle !== 'string') {
      // Fill is a pattern or gradient - align it!
      fillInstruction.push(true);
    }
    return fillInstruction;
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   */
  applyStroke(state) {
    this.instructions.push(this.createStroke(state));
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   * @return {Array<*>} Stroke instruction.
   */
  createStroke(state) {
    return [
      CanvasInstruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth * this.pixelRatio, state.lineCap,
      state.lineJoin, state.miterLimit,
      this.applyPixelRatio(state.lineDash), state.lineDashOffset * this.pixelRatio
    ];
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   * @param {function(this:CanvasBuilder, import("../canvas.js").FillStrokeState):Array<*>} createFill Create fill.
   */
  updateFillStyle(state, createFill) {
    const fillStyle = state.fillStyle;
    if (typeof fillStyle !== 'string' || state.currentFillStyle != fillStyle) {
      if (fillStyle !== undefined) {
        this.instructions.push(createFill.call(this, state));
      }
      state.currentFillStyle = fillStyle;
    }
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   * @param {function(this:CanvasBuilder, import("../canvas.js").FillStrokeState): void} applyStroke Apply stroke.
   */
  updateStrokeStyle(state, applyStroke) {
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
  }

  /**
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   */
  endGeometry(feature) {
    this.beginGeometryInstruction1_[2] = this.instructions.length;
    this.beginGeometryInstruction1_ = null;
    this.beginGeometryInstruction2_[2] = this.hitDetectionInstructions.length;
    this.beginGeometryInstruction2_ = null;
    const endGeometryInstruction = [CanvasInstruction.END_GEOMETRY, feature];
    this.instructions.push(endGeometryInstruction);
    this.hitDetectionInstructions.push(endGeometryInstruction);
  }

  /**
   * Get the buffered rendering extent.  Rendering will be clipped to the extent
   * provided to the constructor.  To account for symbolizers that may intersect
   * this extent, we calculate a buffered extent (e.g. based on stroke width).
   * @return {import("../../extent.js").Extent} The buffered rendering extent.
   * @protected
   */
  getBufferedMaxExtent() {
    if (!this.bufferedMaxExtent_) {
      this.bufferedMaxExtent_ = clone(this.maxExtent);
      if (this.maxLineWidth > 0) {
        const width = this.resolution * (this.maxLineWidth + 1) / 2;
        buffer(this.bufferedMaxExtent_, width, this.bufferedMaxExtent_);
      }
    }
    return this.bufferedMaxExtent_;
  }
}


export default CanvasBuilder;
