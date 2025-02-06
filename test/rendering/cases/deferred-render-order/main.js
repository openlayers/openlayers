import {MapboxVectorLayer} from 'ol-mapbox-style';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const mapboxVectorLayer = new MapboxVectorLayer({
  styleUrl: '/data/styles/bright-v9/style.json',
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(new Point([1822585.77586262, 6141438.140891937]))],
  }),
  style: {
    'circle-radius': 25,
    'circle-fill-color': 'blue',
  },
});

const imageLayer = new VectorImageLayer({
  source: new VectorSource({
    features: [new Feature(new Point([1822585.77586262, 6141438.140891937]))],
  }),
  style: {
    'circle-radius': 20,
    'circle-fill-color': 'red',
  },
});

new Map({
  layers: [mapboxVectorLayer, vectorLayer, imageLayer],
  target: 'map',
  view: new View({
    center: [1822585.77586262, 6141438.140891937],
    zoom: 16,
  }),
});

render({
  message: 'Correct deferred render order for all layer types',
  tolerance: 0.01,
});
