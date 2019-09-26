/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/webgl
 */
import {
  WebGLWorkerMessageType,
  writePointFeatureToBuffers
} from '../renderer/webgl/Layer.js';
import {assign} from '../obj.js';

/** @type {any} */
const worker = self;

worker.onmessage = event => {
  const received = event.data;
  if (received.type === WebGLWorkerMessageType.GENERATE_BUFFERS) {
    // This is specific to point features (x, y, index)
    const baseVertexAttrsCount = 3;
    const baseInstructionsCount = 2;

    const customAttrsCount = received.customAttributesCount;
    const instructionsCount = baseInstructionsCount + customAttrsCount;
    const renderInstructions = new Float32Array(received.renderInstructions);

    const elementsCount = renderInstructions.length / instructionsCount;
    const indicesCount = elementsCount * 6;
    const verticesCount = elementsCount * 4 * (customAttrsCount + baseVertexAttrsCount);
    const indexBuffer = new Uint32Array(indicesCount);
    const vertexBuffer = new Float32Array(verticesCount);

    let bufferPositions = null;
    for (let i = 0; i < renderInstructions.length; i += instructionsCount) {
      bufferPositions = writePointFeatureToBuffers(
        renderInstructions,
        i,
        vertexBuffer,
        indexBuffer,
        customAttrsCount,
        bufferPositions);
    }

    /** @type {import('../renderer/webgl/Layer').WebGLWorkerGenerateBuffersMessage} */
    const message = assign({
      vertexBuffer: vertexBuffer.buffer,
      indexBuffer: indexBuffer.buffer,
      renderInstructions: renderInstructions.buffer
    }, received);

    worker.postMessage(message, [vertexBuffer.buffer, indexBuffer.buffer, renderInstructions.buffer]);
  }
};

export let create;
