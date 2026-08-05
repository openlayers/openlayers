/**
 * @module ol/render/webgl/serialize
 */

import {get as getProjection} from '../../proj.js';

/**
 * This will serialize a frame state into a cloneable object.
 * Note: the user projection is written as code in the frame state because it won't be available in the worker.
 * Caveat: this won't work for custom/non-standard projections!
 * @param {import("../../Map.js").FrameState} frameState Frame state
 * @return {Object} Serialized as object
 */
export function serializeFrameState(frameState) {
  const viewState = frameState.viewState;
  return {
    viewState: {
      ...viewState,
      projection: viewState.projection.getCode(),
    },
    viewHints: frameState.viewHints,
    pixelRatio: frameState.pixelRatio,
    size: frameState.size,
    extent: frameState.extent,
    coordinateToPixelTransform: frameState.coordinateToPixelTransform,
    pixelToCoordinateTransform: frameState.pixelToCoordinateTransform,
    layerStatesArray: frameState.layerStatesArray.map((l) => ({
      zIndex: l.zIndex,
      visible: l.visible,
      extent: l.extent,
      maxResolution: l.maxResolution,
      minResolution: l.minResolution,
      managed: l.managed,
      opacity: l.opacity,
    })),
    time: frameState.time,
    layerIndex: frameState.layerIndex,
  };
}

/**
 * @typedef {Object} SerializedFrameState
 * @property {Object} viewState View state with projection code.
 * @property {Array<number>} viewHints View hints.
 * @property {number} pixelRatio Pixel ratio.
 * @property {Array<number>} size Size.
 * @property {import("../../extent.js").Extent} extent Extent.
 * @property {import("../../transform.js").Transform} coordinateToPixelTransform Transform.
 * @property {import("../../transform.js").Transform} pixelToCoordinateTransform Transform.
 * @property {Array<Object>} layerStatesArray Layer states.
 * @property {number} time Time.
 * @property {number} layerIndex Layer index.
 */

/**
 * @param {SerializedFrameState} serialized Serialized frame state
 * @return {import("../../Map.js").FrameState} Frame state
 */
export function deserializeFrameState(serialized) {
  return /** @type {import("../../Map.js").FrameState} */ ({
    ...serialized,
    viewState: {
      ...serialized.viewState,
      projection: getProjection(
        /** @type {import("../../proj.js").ProjectionLike} */ (
          /** @type {{projection: import("../../proj.js").ProjectionLike}} */ (
            serialized.viewState
          ).projection
        ),
      ),
    },
  });
}
