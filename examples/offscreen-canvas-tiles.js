import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/Layer.js';
//eslint-disable-next-line
import Worker from 'worker-loader!./mvtlayer.worker.js';

const mvtLayerWorker = new Worker();

function getCircularReplacer() {
  const seen = new WeakSet();
  return function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[circular]';
      }
      seen.add(value);
    }
    return value;
  };
}

let container, canvas;

const map = new Map({
  layers: [
    new Layer({
      render: function(frameState) {
        if (!container) {
          container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.width = '100%';
          container.style.height = '100%';
          canvas = document.createElement('canvas');
          canvas.style.position = 'absolute';
          canvas.style.left = '0';
          canvas.style.transformOrigin = 'top left';
          container.appendChild(canvas);
          const offscreen = canvas.transferControlToOffscreen();
          mvtLayerWorker.postMessage({
            canvas: offscreen
          }, [offscreen]);
        }
        mvtLayerWorker.postMessage({
          frameState: JSON.parse(JSON.stringify(frameState, getCircularReplacer()))
        });
        return container;
      }
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
mvtLayerWorker.addEventListener('message', message => {
  if (message.data.type === 'render') {
    map.render();
  } else if (canvas && message.data.type === 'transform-opacity') {
    canvas.style.transform = message.data.transform;
    canvas.style.opacity = message.data.opacity;
  }
});
