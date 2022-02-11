/**
 * @module ol/render/canvas/CircularStringBuilder
 */
import CanvasBuilder from './Builder.js';
import CanvasInstruction, {
  beginPathInstruction,
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
    const geometryDescription = compoundCurveGeometry.getDescription();
    geometryDescription.segmentDescriptions.forEach((segment) => {
      const instruction = this.geometryTypeCanvasInstruction(segment.type);
      const start = curveOffset + segment.start * stride;
      const end = start + segment.length * stride;
      this.instructions.push([instruction, start, end]);
    });
    this.endGeometry(feature);
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
