import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

useGeographic();

const format = new GeoJSON();
const features = format.readFeatures({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, -65],
            [100, 0],
            [0, 65],
            [-100, 0],
            [0, -65],
          ],
        ],
      },
    },
  ],
});

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features,
  }),
  style: {
    'fill-color': '#ddd',
    'stroke-color': '#00AAFF',
    'stroke-width': 1,
  },
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message:
    'Geometries using geographic coordinates are transformed before rendering',
});
