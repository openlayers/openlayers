/**
 * A worker that does cpu-heavy tasks related to webgl rendering.
 * @module ol/worker/textOverlay
 */

import {get} from '../proj.js';
import TextOverlay from '../render/webgl/TextOverlay.js';
import {TextOverlayWorkerMessageType} from '../render/webgl/constants.js';

/** @type {any} */
const worker = self;

/**
 * @type {TextOverlay}
 */
let textOverlay = null;

worker.onmessage = (event) => {
  const received = event.data;
  switch (received.type) {
    case TextOverlayWorkerMessageType.INIT: {
      textOverlay = new TextOverlay(received.style);
      break;
    }
    case TextOverlayWorkerMessageType.LOAD_FEATURES: {
      const batchId = received.batchId;
      const features = received.features;
      console.log(features);
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
      const frameState = received.frameState;

      // restore frame state
      frameState.viewState.projection = get('EPSG:3857');
      // frameState.layerStatesArray = layers.map((l) => l.getLayerState());

      textOverlay.render(frameState, batchesId);

      const canvas = /** @type {OffscreenCanvas} */ (textOverlay.getCanvas());
      const imageData = canvas.transferToImageBitmap();

      /** @type {import('../render/webgl/constants.js').TextOverlayWorkerMessage} */
      const message = {
        type: TextOverlayWorkerMessageType.RENDERED,
        imageData,
      };

      worker.postMessage(message, [imageData]);
      break;
    }
    default:
    // pass
  }
};

/** @type {function(): Worker} */ export let create;
