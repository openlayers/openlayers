/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/textOverlay
 */

import {newParsingContext} from '../expr/expression.js';
import {get as getProjection, setUserProjection} from '../proj.js';
import Executor from '../render/canvas/Executor.js';
import TextBuilder from '../render/canvas/TextBuilder.js';
import {rulesToStyleFunction} from '../render/canvas/style.js';
import TextOverlay from '../render/webgl/TextOverlay.js';
import {TextOverlayWorkerMessageType} from '../render/webgl/constants.js';
import {deserializeFrameState} from '../render/webgl/serialize.js';
import {convertRenderInstructionsToCanvasTextBuilder} from '../render/webgl/textUtil.js';
import {
  compose as composeTransform,
  create as createTransform,
  invert as invertTransform,
  multiply as multiplyTransform,
} from '../transform.js';

/** @type {any} */
const worker = self;

/**
 * @type {TextOverlay}
 */
let textOverlay = null;

let renderOverlayKey = 0;

const canvas = new OffscreenCanvas(1, 1);
const context = canvas.getContext('2d');

let canvasInstructions = null;
let canvasInstructionsInverseTransform = null;

/**
 * @type {Executor}
 */
let executor = null;

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
    case TextOverlayWorkerMessageType.INIT: {
      if (received.userProjection) {
        setUserProjection(received.userProjection);
      }
      textOverlay = new TextOverlay(received.style);
      break;
    }
    // case TextOverlayWorkerMessageType.LOAD_FEATURES: {
    //   const batchId = received.batchId;
    //   const features = received.features.map(deserializeFeature);
    //   textOverlay.loadFeatureBatch(features, batchId);
    //   break;
    // }
    // case TextOverlayWorkerMessageType.UNLOAD_FEATURES: {
    //   const batchId = received.batchId;
    //   textOverlay.unloadFeatureBatch(batchId);
    //   break;
    // }
    case TextOverlayWorkerMessageType.RENDER: {
      // const batchesId = received.batchesId;
      const frameState = deserializeFrameState(received.frameState);
      const viewState = frameState.viewState;
      if (renderOverlayKey) {
        cancelAnimationFrame(renderOverlayKey);
      }
      renderOverlayKey = requestAnimationFrame(() => {
        renderOverlayKey = 0;

        canvas.width = frameState.size[0];
        canvas.height = frameState.size[1];

        const transform = getRenderTransform(
          viewState.center,
          viewState.resolution,
          0,
          frameState.pixelRatio,
          canvas.width,
          canvas.height,
          0,
        );
        multiplyTransform(transform, canvasInstructionsInverseTransform);

        executor.execute(
          context,
          frameState.size,
          transform,
          frameState.viewState.rotation,
          false,
        );

        const imageData = canvas.transferToImageBitmap();

        /** @type {import('../render/webgl/constants.js').TextOverlayWorkerMessage} */
        const message = {
          type: TextOverlayWorkerMessageType.RENDERED,
          imageData,
          frameState: received.frameState,
        };
        worker.postMessage(message, [imageData]);
      });

      break;
    }

    case TextOverlayWorkerMessageType.SET_RENDER_INSTRUCTIONS: {
      const {
        polygonRenderInstructions,
        lineStringRenderInstructions,
        pointRenderInstructions,
        style,
        // customAttributes,
        customAttributesSizes,
        renderInstructionsTransform,
        // TODO: view projection
      } = received;
      const resolution = 1;
      const pixelRatio = 1;
      // const customAttributesSize = getCustomAttributesSize(customAttributes);

      const renderInstructions = new Float32Array(polygonRenderInstructions);
      const labelsArray = new Uint8Array(received.labelsArray);
      const builder = new TextBuilder(
        1,
        getProjection('EPSG:3857').getWorldExtent(),
        resolution,
        pixelRatio,
      );

      const parsingContext = newParsingContext();
      const styleFn = rulesToStyleFunction(style, parsingContext);

      let currentInstructionsIndex = 0;
      while (currentInstructionsIndex < renderInstructions.length) {
        currentInstructionsIndex = convertRenderInstructionsToCanvasTextBuilder(
          renderInstructions,
          labelsArray,
          currentInstructionsIndex,
          parsingContext.properties,
          customAttributesSizes,
          builder,
          styleFn,
        );
      }
      canvasInstructions = builder.finish();
      canvasInstructionsInverseTransform = invertTransform(
        renderInstructionsTransform,
      );
      executor = new Executor(
        resolution,
        pixelRatio,
        false,
        canvasInstructions,
      );

      break;
    }

    default:
    // pass
  }
};

/** @type {function(): Worker} */ export let create;
