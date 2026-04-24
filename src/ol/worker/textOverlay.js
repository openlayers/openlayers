/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/textOverlay
 */

import {newParsingContext} from '../expr/expression.js';
import Executor from '../render/canvas/Executor.js';
import TextBuilder from '../render/canvas/TextBuilder.js';
import {flatStyleLikeToStyleFunction} from '../render/canvas/style.js';
import {TextOverlayWorkerMessageType} from '../render/webgl/constants.js';
import {deserializeFrameState} from '../render/webgl/serialize.js';
import {
  convertLineStringRenderInstructionsToCanvasTextBuilder,
  convertPointRenderInstructionsToCanvasTextBuilder,
  convertPolygonRenderInstructionsToCanvasTextBuilder,
  stripNonTextStyleProperties,
} from '../render/webgl/textUtil.js';
import {
  compose as composeTransform,
  create as createTransform,
  invert as invertTransform,
  multiply as multiplyTransform,
} from '../transform.js';

/** @type {any} */
const worker = self;

let textRenderAnimationFrameKey = 0;

const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext('2d');

/**
 * @typedef {Object} RenderBatch
 * @property {import('../transform.js').Transform} inverseTransform Inverse of transform in which coordinates are expressed
 * @property {import('../render/canvas/Executor.js').default} executor Executor containing instructions
 */

/**
 * This holds all constructed render batches
 * If the value is null, it means the render batch has been processed but no text instruction was needed there
 * @type {Map<string, RenderBatch|null>}
 */
const renderBatches = new Map();

const tmpTransform = createTransform();

function getRenderTransform(
  center,
  resolution,
  rotation,
  pixelRatio,
  width,
  height,
  offsetX,
) {
  const dx1 = width / 2;
  const dy1 = height / 2;
  const sx = pixelRatio / resolution;
  const sy = -sx;
  const dx2 = -center[0] + offsetX;
  const dy2 = -center[1];
  return composeTransform(tmpTransform, dx1, dy1, sx, sy, -rotation, dx2, dy2);
}

worker.onmessage = (event) => {
  const received = event.data;
  switch (received.type) {
    case TextOverlayWorkerMessageType.RENDER: {
      const frameState = deserializeFrameState(received.frameState);
      const viewState = frameState.viewState;
      const batchesToRender = received.batchesToRender;

      if (textRenderAnimationFrameKey) {
        // cancel previously planned frame so they don't stack up
        cancelAnimationFrame(textRenderAnimationFrameKey);
      }
      textRenderAnimationFrameKey = requestAnimationFrame(() => {
        textRenderAnimationFrameKey = 0;

        // either resize or clear
        if (
          frameState.size[0] !== canvas.width ||
          frameState.size[1] !== canvas.height
        ) {
          canvas.width = frameState.size[0];
          canvas.height = frameState.size[1];
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }

        for (const renderBatchKey of batchesToRender.values()) {
          // this can happen if a reference to an older batch was kept; we simply ignore it silently
          if (!renderBatches.has(renderBatchKey)) {
            continue;
          }
          const renderBatch = renderBatches.get(renderBatchKey);
          if (!renderBatch) {
            // no instructions there
            continue;
          }
          const transform = getRenderTransform(
            viewState.center,
            viewState.resolution,
            0,
            frameState.pixelRatio,
            canvas.width,
            canvas.height,
            0,
          );

          multiplyTransform(transform, renderBatch.inverseTransform);
          renderBatch.executor.execute(
            context,
            frameState.size,
            transform,
            frameState.viewState.rotation,
            false,
          );
        }

        const imageData = canvas.transferToImageBitmap();

        /** @type {import('../render/webgl/constants.js').TextOverlayWorkerMessage} */
        const message = {
          type: TextOverlayWorkerMessageType.RENDER,
          imageData,
          frameState: received.frameState,
          id: received.id,
        };
        worker.postMessage(message, [imageData]);
      });

      break;
    }

    case TextOverlayWorkerMessageType.BUILD_INSTRUCTIONS: {
      console.time('BUILD_INSTRUCTIONS');
      const {
        polygonRenderInstructions,
        lineStringRenderInstructions,
        pointRenderInstructions,
        style,
        customAttributesSizes,
        renderInstructionsTransform,
        id,
        // TODO: view projection
      } = received;
      const resolution = 10000000000;
      const pixelRatio = 1;
      const instructionsSetKey = Date.now().toString();
      const labelsArray = new Uint8Array(received.labelsArray);
      const builder = new TextBuilder(
        1,
        [-Infinity, -Infinity, Infinity, Infinity],
        resolution,
        pixelRatio,
      );
      // reconstruct the custom attributes definition obj here
      const customAttributes = Object.keys(customAttributesSizes).reduce(
        (acc, key) => ({...acc, [key]: {size: customAttributesSizes[key]}}),
        {},
      );

      const parsingContext = newParsingContext();
      stripNonTextStyleProperties(style);
      const styleFn = flatStyleLikeToStyleFunction(style, parsingContext);

      console.timeLog('BUILD_INSTRUCTIONS', '/ converted style to styleFn');

      convertPolygonRenderInstructionsToCanvasTextBuilder(
        new Float32Array(polygonRenderInstructions),
        renderInstructionsTransform,
        labelsArray,
        parsingContext.properties,
        customAttributes,
        builder,
        styleFn,
      );
      console.timeLog('BUILD_INSTRUCTIONS', '/ parsed polygon instructions');
      convertLineStringRenderInstructionsToCanvasTextBuilder(
        new Float32Array(lineStringRenderInstructions),
        renderInstructionsTransform,
        labelsArray,
        parsingContext.properties,
        customAttributes,
        builder,
        styleFn,
      );
      console.timeLog('BUILD_INSTRUCTIONS', '/ parsed lineString instructions');
      convertPointRenderInstructionsToCanvasTextBuilder(
        new Float32Array(pointRenderInstructions),
        renderInstructionsTransform,
        labelsArray,
        parsingContext.properties,
        customAttributes,
        builder,
        styleFn,
      );
      console.timeLog('BUILD_INSTRUCTIONS', '/ parsed point instructions');

      const canvasInstructions = builder.finish();

      // nothing to draw
      if (canvasInstructions.instructions.length === 0) {
        renderBatches.set(instructionsSetKey, null);
      } else {
        const inverseTransform = invertTransform(renderInstructionsTransform);
        const executor = new Executor(
          resolution,
          pixelRatio,
          false,
          canvasInstructions,
        );
        renderBatches.set(instructionsSetKey, {
          inverseTransform,
          executor,
        });
      }

      /** @type {import('../render/webgl/constants.js').TextOverlayWorkerMessage} */
      const message = {
        type: TextOverlayWorkerMessageType.BUILD_INSTRUCTIONS,
        instructionsSetKey,
        id,
      };
      worker.postMessage(message);

      console.timeEnd('BUILD_INSTRUCTIONS');
      break;
    }

    case TextOverlayWorkerMessageType.DISPOSE_INSTRUCTIONS: {
      const {instructionsSetKey} = received;
      if (renderBatches.has(instructionsSetKey)) {
        renderBatches.delete(instructionsSetKey);
      }
      break;
    }

    default:
    // pass
  }
};

/** @type {function(): Worker} */ export let create;
