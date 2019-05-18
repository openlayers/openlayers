/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/webgl
 */
import {
  POINT_INSTRUCTIONS_COUNT,
  POINT_VERTEX_STRIDE,
  WebGLWorkerMessageType,
  writePointFeatureToBuffers
} from '../renderer/webgl/Layer.js';
import {assign} from '../obj.js';

onmessage = event => {
  const received = event.data;
  if (received.type === WebGLWorkerMessageType.GENERATE_BUFFERS) {
    const renderInstructions = new Float32Array(received.renderInstructions);
    const customAttributesCount = received.customAttributesCount || 0;
    const instructionsCount = POINT_INSTRUCTIONS_COUNT + customAttributesCount;

    const elementsCount = renderInstructions.length / instructionsCount;
    const indexBuffer = new Uint32Array(elementsCount * 6);
    const vertexBuffer = new Float32Array(elementsCount * 4 * (POINT_VERTEX_STRIDE + customAttributesCount));

    let bufferPositions = null;
    for (let i = 0; i < renderInstructions.length; i += instructionsCount) {
      bufferPositions = writePointFeatureToBuffers(
        renderInstructions,
        i,
        vertexBuffer,
        indexBuffer,
        bufferPositions,
        instructionsCount);
    }

    /** @type {import('../renderer/webgl/Layer').WebGLWorkerGenerateBuffersMessage} */
    const message = assign({
      vertexBuffer: vertexBuffer.buffer,
      indexBuffer: indexBuffer.buffer,
      renderInstructions: renderInstructions.buffer
    }, received);

    postMessage(message, [vertexBuffer.buffer, indexBuffer.buffer, renderInstructions.buffer]);
  }
};

export let create;
