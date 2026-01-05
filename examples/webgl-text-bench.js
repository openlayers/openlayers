import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLTextLayer from '../src/ol/layer/WebGLText.js';
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
      color: [Math.random(), Math.random(), Math.random(), 1.0],
      outlineColor: [0.0, 0.0, 0.0, 1.0],
      outlineWidth: 0.2,
      textSize: 24 + Math.random() * 24,
      rotation: Math.random() * Math.PI * 2,
    }),
  );
}
vectorSource.addFeatures(features);

const textLayer = new WebGLTextLayer({
  source: vectorSource,
  style: {
    fontFamily: 'Courier New',
    fontWeight: 'bold',
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
