import {loadImageUsingDom} from '../src/ol/loadImage.js';

const waitingPromisesFunctions = {};
let counter = 0;


/**
 *
 * @param {string} src Source.
 * @param {Options} options Options.
 * @param {function((HTMLImageElement|ImageBitmap)): any} onSuccess Success .
 * @param {Function} onError Error callback.
 */
export function loadImageFromWithinWorker(src, options, onSuccess, onError) {
  const opaqueId = ++counter;
  waitingPromisesFunctions[opaqueId] = {
    ok: onSuccess,
    ko: onError,
    src
  };

  // In chrome, loading SVGs is not possible inside a worker,
  // so we ask the main thread for it.
  // For simplicity we use this mechanism for all images / all browsers.
  self.postMessage({
    action: 'loadImage',
    opaqueId,
    src,
    options
  });
}

export function registerMessageListenerForWorker() {
  addEventListener('message', function(event) {
    const action = event.data.action;
    if (action === 'continueWorkerImageLoading') {
      const {opaqueId, image} = event.data;
      const functions = waitingPromisesFunctions[opaqueId];
      delete waitingPromisesFunctions[opaqueId];
      image ? functions.ok(image) : functions.ko();
    }
  });
}

export function registerMessageListenerForMainThread(worker) {
  worker.addEventListener('message', function(event) {
    if (event.data.action != 'loadImage') {
      return;
    }
    const {src, options, opaqueId} = event.data;
    function onSuccess(domImage) {
      createImageBitmap(domImage).then(function(bmp) {
        worker.postMessage({
          action: 'continueWorkerImageLoading',
          opaqueId: opaqueId,
          image: bmp
        },
        [bmp]);
      });
    }
    function onError() {
      worker.postMessage({
        action: 'continueWorkerImageLoading',
        opaqueId: opaqueId,
        image: null
      });
    }
    loadImageUsingDom(src, options, onSuccess, onError);
  });
}
