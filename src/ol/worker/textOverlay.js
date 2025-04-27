/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/textOverlay
 */

import {setUserProjection} from '../proj.js';
import TextOverlay from '../render/webgl/TextOverlay.js';
import {TextOverlayWorkerMessageType} from '../render/webgl/constants.js';
import {
  deserializeFeature,
  deserializeFrameState,
} from '../render/webgl/serialize.js';

/** @type {any} */
const worker = self;

/**
 * @type {TextOverlay}
 */
let textOverlay = null;

let renderOverlayKey = 0;

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
    case TextOverlayWorkerMessageType.LOAD_FEATURES: {
      const batchId = received.batchId;
      const features = received.features.map(deserializeFeature);
      textOverlay.loadFeatureBatch(features, batchId);
      break;
    }
    case TextOverlayWorkerMessageType.UNLOAD_FEATURES: {
      const batchId = received.batchId;
      textOverlay.unloadFeatureBatch(batchId);
      break;
    }
    case TextOverlayWorkerMessageType.RENDER: {
      const batchesId = received.batchesId;
      const frameState = deserializeFrameState(received.frameState);
      if (renderOverlayKey) {
        cancelAnimationFrame(renderOverlayKey);
      }
      renderOverlayKey = requestAnimationFrame(() => {
        renderOverlayKey = 0;
        textOverlay.render(frameState, batchesId);
        const canvas = /** @type {OffscreenCanvas} */ (textOverlay.getCanvas());
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
    default:
    // pass
  }
};

/** @type {function(): Worker} */ export let create;
