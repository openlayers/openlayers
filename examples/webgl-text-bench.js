import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import Vector from '../src/ol/source/Vector.js';

const vectorSource = new Vector({
  wrapX: true,
});

const features = [];
const count = 20000;

const e = 18000000;
for (let i = 0; i < count; ++i) {
  const x = 2 * e * Math.random() - e;
  const y = 2 * e * Math.random() - e;

  const label = i % 2 === 0 ? 'OpenLayers' : 'WebGL';

  features.push(
    new Feature({
      geometry: new Point([x, y]),
      name: label,
    }),
  );
}
vectorSource.addFeatures(features);

// Stress test: 20000 text labels rendered by a single WebGLVectorLayer. The
// label content and color are driven from feature data via the flat style.
const textLayer = new WebGLVectorLayer({
  source: vectorSource,
  style: {
    'text-value': ['get', 'name'],
    'text-font': 'bold 18px Courier New',
    'text-fill-color': [
      'match',
      ['get', 'name'],
      'OpenLayers',
      '#1a73e8',
      '#e8710a',
    ],
    'text-stroke-color': 'rgba(0, 0, 0, 1)',
    'text-stroke-width': 1,
  },
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5,
    }),
    textLayer,
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});
