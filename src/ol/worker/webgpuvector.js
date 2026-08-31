/**
 * A worker that tessellates vector geometry for the WebGPU renderers.
 * @module ol/worker/webgpuvector
 */
import {buildGeometryBuffers} from '../render/webgpu/geometryBuffers.js';

/** @type {any} */
const worker = self;

worker.onmessage = (/** @type {MessageEvent} */ event) => {
  const received = event.data;
  const request = received.request;
  request.coordinates = new Float64Array(request.coordinates);
  request.styles = new Float32Array(request.styles);
  const buildStart = performance.now();
  const buffers = buildGeometryBuffers(request);
  const buildDuration = performance.now() - buildStart;
  worker.postMessage(
    {
      id: received.id,
      buildDuration,
      buffers: {
        fillPositions: buffers.fillPositions.buffer,
        fillStyles: buffers.fillStyles.buffer,
        fillIndices: buffers.fillIndices.buffer,
        strokePositions: buffers.strokePositions.buffer,
        strokeAttributes: buffers.strokeAttributes.buffer,
        strokeStyles: buffers.strokeStyles.buffer,
        strokeIndices: buffers.strokeIndices.buffer,
        styles: buffers.styles.buffer,
        grid: buffers.grid,
        ranges: buffers.ranges,
      },
    },
    [
      buffers.fillPositions.buffer,
      buffers.fillStyles.buffer,
      buffers.fillIndices.buffer,
      buffers.strokePositions.buffer,
      buffers.strokeAttributes.buffer,
      buffers.strokeStyles.buffer,
      buffers.strokeIndices.buffer,
      buffers.styles.buffer,
    ],
  );
};

/** @type {function(): Worker} */ export let create;
