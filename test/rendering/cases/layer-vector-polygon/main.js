import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const feature = new Feature({
  geometry: new Polygon([
    [
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
      [-180, -90],
    ],
    [
      [0, 60],
      [-17.6336, 24.2705],
      [-57.0634, 18.541],
      [-28.5317, -9.2705],
      [-35.2671, -48.541],
      [0, -30],
      [35.2671, -48.541],
      [28.5317, -9.2705],
      [57.0634, 18.541],
      [17.6336, 24.2705],
      [0, 60],
    ],
  ]),
});

const src = new VectorSource({
  features: [feature],
});
const layer = new VectorLayer({
  renderBuffer: 0,
  source: src,
  style: {
    'fill-color': 'blue',
  },
});
const view = new View({
  center: [0, 0],
  zoom: 1,
  projection: 'EPSG:4326',
});
new Map({
  pixelRatio: 1,
  layers: [layer],
  target: 'map',
  view: view,
});

render();
