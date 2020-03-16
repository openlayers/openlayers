import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/Layer.js';
//eslint-disable-next-line
import Worker from 'worker-loader!./mvtlayer.worker.js';
import {compose, create} from '../src/ol/transform.js';
import {createTransformString} from '../src/ol/render/canvas.js';
import {getFontParameters} from '../src/ol/css.js';

const mvtLayerWorker = new Worker();

const loadingImages = {};
mvtLayerWorker.addEventListener('message', event => {
  if (event.data.type === 'getFontParameters') {
    getFontParameters(event.data.font, font => {
      mvtLayerWorker.postMessage({
        type: 'getFontParameters',
        font: font
      });
    });
  } else if (event.data.type === 'loadImage') {
    if (!(event.data.src in loadingImages)) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.addEventListener('load', function() {
        createImageBitmap(image, 0, 0, image.width, image.height).then(imageBitmap => {
          delete loadingImages[event.data.iconName];
          mvtLayerWorker.postMessage({
            type: 'imageLoaded',
            image: imageBitmap,
            iconName: event.data.iconName
          }, [imageBitmap]);
        });
      });
      image.src = 'https://unpkg.com/@mapbox/maki@4.0.0/icons/' + event.data.iconName + '-15.svg';
      loadingImages[event.data.iconName] = true;
    }
  }
});

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

let container, transformContainer, canvas, workerFrameState, mainThreadFrameState;

function updateContainerTransform() {
  if (workerFrameState) {
    const viewState = mainThreadFrameState.viewState;
    const renderedViewState = workerFrameState.viewState;
    const center = viewState.center;
    const resolution = viewState.resolution;
    const rotation = viewState.rotation;
    const renderedCenter = renderedViewState.center;
    const renderedResolution = renderedViewState.resolution;
    const renderedRotation = renderedViewState.rotation;
    const transform = compose(create(),
      (renderedCenter[0] - center[0]) / resolution,
      (center[1] - renderedCenter[1]) / resolution,
      renderedResolution / resolution, renderedResolution / resolution,
      rotation - renderedRotation,
      0, 0);
    transformContainer.style.transform = createTransformString(transform);
  }

}

const map = new Map({
  layers: [
    new Layer({
      render: function(frameState) {
        if (!container) {
          container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.width = '100%';
          container.style.height = '100%';
          transformContainer = document.createElement('div');
          transformContainer.style.position = 'absolute';
          transformContainer.style.width = '100%';
          transformContainer.style.height = '100%';
          container.appendChild(transformContainer);
          canvas = document.createElement('canvas');
          canvas.style.position = 'absolute';
          canvas.style.left = '0';
          canvas.style.transformOrigin = 'top left';
          transformContainer.appendChild(canvas);
        }
        mainThreadFrameState = frameState;
        updateContainerTransform();
        mvtLayerWorker.postMessage({
          type: 'render',
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
mvtLayerWorker.addEventListener('message', function(message) {
  if (message.data.type === 'request-render') {
    map.render();
  } else if (canvas && message.data.type === 'rendered') {
    transformContainer.style.transform = '';
    const imageData = message.data.imageData;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').drawImage(imageData, 0, 0);
    canvas.style.opacity = message.data.opacity;
    canvas.style.transform = message.data.transform;
    workerFrameState = message.data.frameState;
    updateContainerTransform();
  }
});
