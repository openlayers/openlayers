/* eslint-disable no-console */
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Link from '../src/ol/interaction/Link.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const map = new Map({
  layers: [],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});

const source = new VectorSource();

const colors = ['#6ff05b', '#00AAFF', '#faa91e'];

const style = {
  'fill-color': ['get', 'color'],
  'stroke-color': 'gray',
  'stroke-width': 1.5,
};

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style,
    });
  }
}

function useWebGL() {
  map.getLayers().clear();
  map.addLayer(new WebGLLayer({source}));
}

function useCanvas() {
  map.getLayers().clear();
  map.addLayer(new VectorLayer({source, style}));
}

const link = new Link();

const webglToggle = document.getElementById('renderer');
webglToggle.addEventListener('change', function () {
  if (webglToggle.checked) {
    link.update('renderer', 'webgl');
    useWebGL();
  } else {
    link.update('renderer', 'canvas');
    useCanvas();
  }
});

const initialRenderer = link.track('renderer', (newRenderer) => {
  if (newRenderer === 'webgl') {
    webglToggle.checked = true;
    useWebGL();
  } else {
    webglToggle.checked = false;
    useCanvas();
  }
});
webglToggle.checked = initialRenderer === 'webgl';

const countSelect = document.getElementById('count');
countSelect.addEventListener('change', function () {
  link.update('count', countSelect.value);
  main(parseInt(countSelect.value));
});

const initialCount = link.track('count', (newCount) => {
  main(parseInt(newCount));
});
if (initialCount) {
  countSelect.value = initialCount;
}

map.addInteraction(link);

function makeData(count) {
  const size = 180 / Math.floor(Math.sqrt(count / 2));
  const features = [];
  for (let lon = -180; lon < 180 - size / 4; lon += size) {
    for (let lat = -90; lat < 90 - size / 4; lat += size) {
      const buffer = (0.1 + Math.random() * 0.1) * size;
      features.push({
        type: 'Feature',
        properties: {
          color: colors[Math.floor(Math.random() * colors.length)],
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon + buffer, lat + buffer],
              [lon + size - buffer, lat + buffer],
              [lon + size - buffer, lat + size - buffer],
              [lon + buffer, lat + size - buffer],
              [lon + buffer, lat + buffer],
            ],
          ],
        },
      });
    }
  }
  return {
    type: 'FeatureCollection',
    features,
  };
}

const format = new GeoJSON();
function parseFeatures(data) {
  console.time('parse features');
  const features = format.readFeatures(data);
  console.timeEnd('parse features');
  return features;
}

async function addFeatures(features) {
  console.time('add features');
  source.addFeatures(features);
  console.timeEnd('add features');
}

function main(count) {
  source.clear();
  const data = makeData(count);
  const features = parseFeatures(data);
  addFeatures(features);
  if (initialRenderer === 'webgl') {
    useWebGL();
  } else {
    useCanvas();
  }
}

main(initialCount ? parseInt(initialCount) : parseInt(countSelect.value));
