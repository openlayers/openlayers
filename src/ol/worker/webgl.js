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

      const customAttrsCount = received.customAttributesSize;
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
          bufferPositions,
        );
      }

      /** @type {import('../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
      const message = Object.assign(
        {
          vertexBuffer: vertexBuffer.buffer,
          indexBuffer: indexBuffer.buffer,
          renderInstructions: renderInstructions.buffer,
        },
        received,
      );

      worker.postMessage(message, [
        vertexBuffer.buffer,
        indexBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
    case WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS: {
      /** @type {Array<number>} */
      const vertices = [];
      /** @type {Array<number>} */
      const indices = [];

      const customAttrsCount = received.customAttributesSize;
      const instructionsPerVertex = 3;

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
            currentInstructionsIndex + customAttrsCount,
          ),
        );
        currentInstructionsIndex += customAttrsCount;
        verticesCount = renderInstructions[currentInstructionsIndex++];

        const firstInstructionsIndex = currentInstructionsIndex;
        const lastInstructionsIndex =
          currentInstructionsIndex +
          (verticesCount - 1) * instructionsPerVertex;
        const isLoop =
          renderInstructions[firstInstructionsIndex] ===
            renderInstructions[lastInstructionsIndex] &&
          renderInstructions[firstInstructionsIndex + 1] ===
            renderInstructions[lastInstructionsIndex + 1];

        let currentLength = 0;
        let currentAngleTangentSum = 0;

        // last point is only a segment end, do not loop over it
        for (let i = 0; i < verticesCount - 1; i++) {
          let beforeIndex = null;
          if (i > 0) {
            beforeIndex =
              currentInstructionsIndex + (i - 1) * instructionsPerVertex;
          } else if (isLoop) {
            beforeIndex = lastInstructionsIndex - instructionsPerVertex;
          }
          let afterIndex = null;
          if (i < verticesCount - 2) {
            afterIndex =
              currentInstructionsIndex + (i + 2) * instructionsPerVertex;
          } else if (isLoop) {
            afterIndex = firstInstructionsIndex + instructionsPerVertex;
          }
          const measures = writeLineSegmentToBuffers(
            renderInstructions,
            currentInstructionsIndex + i * instructionsPerVertex,
            currentInstructionsIndex + (i + 1) * instructionsPerVertex,
            beforeIndex,
            afterIndex,
            vertices,
            indices,
            customAttributes,
            invertTransform,
            currentLength,
            currentAngleTangentSum,
          );
          currentLength = measures.length;
          currentAngleTangentSum = measures.angle;
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
        received,
      );

      worker.postMessage(message, [
        vertexBuffer.buffer,
        indexBuffer.buffer,
        renderInstructions.buffer,
      ]);
      break;
    }
    case WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS: {
      /** @type {Array<number>} */
      const vertices = [];
      /** @type {Array<number>} */
      const indices = [];

      const customAttrsCount = received.customAttributesSize;
      const renderInstructions = new Float32Array(received.renderInstructions);

      let currentInstructionsIndex = 0;
      while (currentInstructionsIndex < renderInstructions.length) {
        currentInstructionsIndex = writePolygonTrianglesToBuffers(
          renderInstructions,
          currentInstructionsIndex,
          vertices,
          indices,
          customAttrsCount,
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
        received,
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
