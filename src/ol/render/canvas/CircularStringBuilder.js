/**
 * @module ol/render/canvas/CircularStringBuilder
 */
import CanvasBuilder from './Builder.js';
import CanvasInstruction, {
  beginPathInstruction, closePathInstruction, fillInstruction,
  strokeInstruction,
} from './Instruction.js';
import GeometryType from '../../geom/GeometryType.js';

class CanvasCircularStringBuilder extends CanvasBuilder {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Maximum extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   */
  constructor(tolerance, maxExtent, resolution, pixelRatio) {
    super(tolerance, maxExtent, resolution, pixelRatio);
  }

  /**
   * @param {Array<number>} flatCoordinates Flat coordinates.
   * @param {number} stride The stride.
   */
  appendFlatCircularStringCoordinates(flatCoordinates, stride) {
    const coordinates = this.coordinates;
    const length = flatCoordinates.length;
    let myEnd = this.coordinates.length;
    for (let i = 0; i < length; i += stride) {
      coordinates[myEnd++] = flatCoordinates[i];
      coordinates[myEnd++] = flatCoordinates[i + 1];
    }
  }

  /**
   * @param {import("../../geom/CircularString.js").default|import("../Feature.js").default} circularStringGeometry Circular string geometry.
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   */
  drawCircularString(circularStringGeometry, feature) {
    const state = this.state;
    const strokeStyle = state.strokeStyle;
    const lineWidth = state.lineWidth;
    if (strokeStyle === undefined || lineWidth === undefined) {
      return;
    }
    this.updateStrokeStyle(state, this.applyStroke);
    this.beginGeometry(circularStringGeometry, feature);
    const startIndex = this.coordinates.length;
    const coordinates = circularStringGeometry.getFlatCoordinates();
    const stride = circularStringGeometry.getStride();
    const endIndex = startIndex + (coordinates.length / stride) * 2;
    this.appendFlatCircularStringCoordinates(coordinates, stride);
    this.instructions.push([
      CanvasInstruction.CIRCULAR_ARC,
      startIndex,
      endIndex,
    ]);
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/GeometryType.js").default} geometryType The given geometry type.
   * @return {CanvasInstruction} The canvas instruction.
   */
  geometryTypeCanvasInstruction(geometryType) {
    switch (geometryType) {
      case GeometryType.CIRCULAR_STRING:
        return CanvasInstruction.CIRCULAR_ARC;
      case GeometryType.LINE_STRING:
        return CanvasInstruction.MOVE_TO_LINE_TO;
      default:
        // Should not happen
        return CanvasInstruction.MOVE_TO_LINE_TO;
    }
  }

  drawCompoundCurve(compoundCurveGeometry, feature) {
    const state = this.state;
    const strokeStyle = state.strokeStyle;
    const lineWidth = state.lineWidth;
    if (strokeStyle === undefined || lineWidth === undefined) {
      return;
    }
    this.updateStrokeStyle(state, this.applyStroke);
    this.beginGeometry(compoundCurveGeometry, feature);
    const curveOffset = this.coordinates.length;
    const coordinates = compoundCurveGeometry.getFlatCoordinates();
    const stride = compoundCurveGeometry.getStride();
    this.appendFlatCircularStringCoordinates(coordinates, stride);
    this.appendCompoundCurveInstructions(
      compoundCurveGeometry,
      curveOffset,
      stride
    );
    this.endGeometry(feature);
  }

  appendCompoundCurveInstructions(compoundCurveGeometry, curveOffset, stride) {
    const geometryDescription = compoundCurveGeometry.getDescription();
    geometryDescription.segmentDescriptions.forEach((segment) => {
      const instruction = this.geometryTypeCanvasInstruction(segment.type);
      const start = curveOffset + segment.start * stride;
      const end = start + segment.length * stride;
      this.instructions.push([instruction, start, end]);
    });
  }

  drawCurvePolygon(curvePolygonGeometry, feature) {
    const state = this.state;
    const fillStyle = state.fillStyle;
    const strokeStyle = state.strokeStyle;
    if (fillStyle === undefined && strokeStyle === undefined) {
      return;
    }
    this.setFillStrokeStyles_();
    this.beginGeometry(curvePolygonGeometry, feature);
    this.appendCurvePolygonInstructions(curvePolygonGeometry);
    this.endGeometry(feature);
  }

  /**
   * @param {import("../../geom/CurvePolygon.js").default} curvePolygonGeometry Curve Polygon.
   */
  appendCurvePolygonInstructions(curvePolygonGeometry) {
    const state = this.state;
    const fill = state.fillStyle !== undefined;
    const stroke = state.strokeStyle !== undefined;
    let offset = 0;
    const numOfRings = curvePolygonGeometry.getRings().length;

    for (let i = 0; i < numOfRings; ++i) {
      const ring = curvePolygonGeometry.getRings()[i];
      const stride = ring.getStride();
      const end = curvePolygonGeometry.getEnds()[i];
      const myBegin = this.coordinates.length;
      const myEnd = this.appendCoordinates(ring.getFlatCoordinates(), stride);
      switch (ring.getType()) {
        case GeometryType.LINE_STRING:
          this.instructions.push([
            CanvasInstruction.MOVE_TO_LINE_TO,
            myBegin,
            myEnd,
          ]);
          break;

        case GeometryType.CIRCULAR_STRING:
          this.instructions.push([
            CanvasInstruction.CIRCULAR_ARC,
            myBegin,
            myEnd,
          ]);
          break;

        case GeometryType.COMPOUND_CURVE:
          const compoundCurve =
            /** @type {import('../../geom/CompoundCurve.js').default} */ (ring);
          this.appendCompoundCurveInstructions(compoundCurve, myBegin, stride);
          break;

        default:
          throw new Error('Geometry type not supported in curve polygon');
      }
      if (stroke) {
        // Performance optimization: only call closePath() when we have a stroke.
        // Otherwise the ring is closed already (see appendFlatLineCoordinates above).
        this.instructions.push(closePathInstruction);
      }
      offset = end;
    }
    if (fill) {
      this.instructions.push(fillInstruction);
    }
    if (stroke) {
      this.instructions.push(strokeInstruction);
    }
    return offset;
  }

  appendCoordinates(flatCoordinates, stride) {
    const coordinates = this.coordinates;
    const length = flatCoordinates.length;
    let myEnd = this.coordinates.length;
    for (let i = 0; i < length; i += stride) {
      coordinates[myEnd++] = flatCoordinates[i];
      coordinates[myEnd++] = flatCoordinates[i + 1];
    }
    return myEnd;
  }

  /**
   * @private
   */
  setFillStrokeStyles_() {
    const state = this.state;
    const fillStyle = state.fillStyle;
    if (fillStyle !== undefined) {
      this.updateFillStyle(state, this.createFill);
    }
    if (state.strokeStyle !== undefined) {
      this.updateStrokeStyle(state, this.applyStroke);
    }
  }

  /**
   * @return {import("../canvas.js").SerializableInstructions} the serializable instructions.
   */
  finish() {
    const state = this.state;
    if (
      state.lastStroke !== undefined &&
      state.lastStroke !== this.coordinates.length
    ) {
      this.instructions.push(strokeInstruction);
    }
    this.reverseHitDetectionInstructions();
    this.state = null;
    return super.finish();
  }

  /**
   * @param {import("../canvas.js").FillStrokeState} state State.
   */
  applyStroke(state) {
    if (
      state.lastStroke !== undefined &&
      state.lastStroke !== this.coordinates.length
    ) {
      this.instructions.push(strokeInstruction);
      state.lastStroke = this.coordinates.length;
    }
    state.lastStroke = 0;
    super.applyStroke(state);
    this.instructions.push(beginPathInstruction);
  }
}

export default CanvasCircularStringBuilder;
