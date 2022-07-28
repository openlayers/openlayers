/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/webgl
 */
import {WebGLWorkerMessageType} from '../render/webgl/constants.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../transform.js';
import {
  writeLineSegmentToBuffers,
  writePointFeatureToBuffers,
  writePolygonTrianglesToBuffers,
} from '../render/webgl/utils.js';

/** @type {any} */
const worker = self;

worker.onmessage = (event) => {
  const received = event.data;
  switch (received.type) {
    case WebGLWorkerMessageType.GENERATE_POINT_BUFFERS: {
      // This is specific to point features (x, y, index)
      const baseVertexAttrsCount = 3;
      const baseInstructionsCount = 2;

      const customAttrsCount = received.customAttributesCount;
      const instructionsCount = baseInstructionsCount + customAttrsCount;
      const renderInstructions = new Float32Array(received.renderInstructions);

      const elementsCount = renderInstructions.length / instructionsCount;
      const indicesCount = elementsCount * 6;
      const verticesCount =
        elementsCount * 4 * (customAttrsCount + baseVertexAttrsCount);
      const indexBuffer = new Uint32Array(indicesCount);
      const vertexBuffer = new Float32Array(verticesCount);

      let bufferPositions;
      for (let i = 0; i < renderInstructions.length; i += instructionsCount) {
        bufferPositions = writePointFeatureToBuffers(
          renderInstructions,
          i,
          vertexBuffer,
          indexBuffer,
          customAttrsCount,
          bufferPositions
        );
      }

      /** @type {import('../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
      const message = Object.assign(
        {
          vertexBuffer: vertexBuffer.buffer,
          indexBuffer: indexBuffer.buffer,
          renderInstructions: renderInstructions.buffer,
        },
        received
      );

      worker.postMessage(message, [
        vertexBuffer.buffer,
        indexBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
    case WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS: {
      const vertices = [];
      const indices = [];

      const customAttrsCount = received.customAttributesCount;
      const instructionsPerVertex = 2;

      const renderInstructions = new Float32Array(received.renderInstructions);
      let currentInstructionsIndex = 0;

      const transform = received.renderInstructionsTransform;
      const invertTransform = createTransform();
      makeInverseTransform(invertTransform, transform);

      let verticesCount, customAttributes;
      while (currentInstructionsIndex < renderInstructions.length) {
        customAttributes = Array.from(
          renderInstructions.slice(
            currentInstructionsIndex,
            currentInstructionsIndex + customAttrsCount
          )
        );
        currentInstructionsIndex += customAttrsCount;
        verticesCount = renderInstructions[currentInstructionsIndex++];

        // last point is only a segment end, do not loop over it
        for (let i = 0; i < verticesCount - 1; i++) {
          writeLineSegmentToBuffers(
            renderInstructions,
            currentInstructionsIndex + i * instructionsPerVertex,
            currentInstructionsIndex + (i + 1) * instructionsPerVertex,
            i > 0
              ? currentInstructionsIndex + (i - 1) * instructionsPerVertex
              : null,
            i < verticesCount - 2
              ? currentInstructionsIndex + (i + 2) * instructionsPerVertex
              : null,
            vertices,
            indices,
            customAttributes,
            transform,
            invertTransform
          );
        }
        currentInstructionsIndex += verticesCount * instructionsPerVertex;
      }

      const indexBuffer = Uint32Array.from(indices);
      const vertexBuffer = Float32Array.from(vertices);

      /** @type {import('../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
      const message = Object.assign(
        {
          vertexBuffer: vertexBuffer.buffer,
          indexBuffer: indexBuffer.buffer,
          renderInstructions: renderInstructions.buffer,
        },
        received
      );

      worker.postMessage(message, [
        vertexBuffer.buffer,
        indexBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
    case WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS: {
      const vertices = [];
      const indices = [];

      const customAttrsCount = received.customAttributesCount;
      const renderInstructions = new Float32Array(received.renderInstructions);

      let currentInstructionsIndex = 0;
      while (currentInstructionsIndex < renderInstructions.length) {
        currentInstructionsIndex = writePolygonTrianglesToBuffers(
          renderInstructions,
          currentInstructionsIndex,
          vertices,
          indices,
          customAttrsCount
        );
      }

      const indexBuffer = Uint32Array.from(indices);
      const vertexBuffer = Float32Array.from(vertices);

      /** @type {import('../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
      const message = Object.assign(
        {
          vertexBuffer: vertexBuffer.buffer,
          indexBuffer: indexBuffer.buffer,
          renderInstructions: renderInstructions.buffer,
        },
        received
      );

      worker.postMessage(message, [
        vertexBuffer.buffer,
        indexBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
    default:
    // pass
  }
};

export let create;
