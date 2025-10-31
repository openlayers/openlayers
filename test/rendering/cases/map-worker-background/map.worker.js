import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {createMockDiv} from '../../../../src/ol/dom.js';
import Layer from '../../../../src/ol/layer/Layer.js';

/** @type {any} */
const worker = self;

worker.onmessage = (event) => {
  if (event.data.action !== 'render') {
    return;
  }
  const map = new Map({
    pixelRatio: 1,
    target: new OffscreenCanvas(256, 256),
    layers: [
      new Layer({
        render() {
          const div = createMockDiv();
          div.style.backgroundColor = 'orangered';
          return div;
        },
      }),
    ],
    view: new View({
      center: [0, 0],
      zoom: 0,
    }),
  });
  map.on('rendercomplete', (e) => {
    const bitmap = e.target.getTargetElement().transferToImageBitmap();
    worker.postMessage(
      {
        action: 'rendered',
        bitmap: bitmap,
      },
      [bitmap],
    );
  });
};
