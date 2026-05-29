import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const feature = new Feature(new Point([0, 0]));
feature.set('label', 'Hello');

const source = new VectorSource({features: [feature]});

const layer = new WebGLVectorLayer({
  source: source,
  style: {
    'circle-radius': 4,
    'circle-fill-color': '#3399cc',
    'text-value': ['get', 'label'],
    'text-fill-color': '#000000',
    'text-stroke-color': '#ffffff',
    'text-stroke-width': 2,
    'font-size': 24,
  },
});

new Map({
  layers: [layer],
  target: 'map',
  view: new View({center: [0, 0], zoom: 2}),
});

render({
  message: 'renders WebGL text labels on point features',
  tolerance: 0.01,
});
