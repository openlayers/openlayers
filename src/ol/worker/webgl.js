/**
 * @module ol/worker/webgl
 * A worker that does cpu-heavy tasks related to webgl rendering
 */
import {POINT_INSTRUCTIONS_COUNT, POINT_VERTEX_STRIDE, writePointFeatureToBuffers} from '../renderer/webgl/Layer.js';

onmessage = event => {
  if (event.data.type === 'generate-buffer') {
    const renderInstructions = new Float32Array(event.data.renderInstructions);
    const customAttributesCount = event.data.customAttributesCount || 0;
    const instructionsCount = POINT_INSTRUCTIONS_COUNT + customAttributesCount;
    const projectionTransform = event.data.projectionTransform;

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

    postMessage({
      type: 'buffers-generated',
      vertexBuffer: vertexBuffer.buffer,
      indexBuffer: indexBuffer.buffer,
      projectionTransform
    }, [vertexBuffer.buffer, indexBuffer.buffer]);
  }
};

export let create;
