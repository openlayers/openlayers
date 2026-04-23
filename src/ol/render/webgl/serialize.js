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
    pixelToCoordinateTransform: frameState.coordinateToPixelTransform,
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
 * @param {Object} serialized Serialized frame state
 * @return {import("../../Map.js").FrameState} Frame state
 */
export function deserializeFrameState(serialized) {
  return {
    ...serialized,
    viewState: {
      ...serialized.viewState,
      projection: getProjection(serialized.viewState.projection),
    },
  };
}
