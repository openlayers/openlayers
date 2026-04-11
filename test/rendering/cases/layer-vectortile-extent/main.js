import {MapboxVectorLayer} from 'ol-mapbox-style';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {buffer} from '../../../../src/ol/extent.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const center = [1822585.77586262, 6141438.140891937];
const extent = buffer([...center, ...center], 200);

const mapboxVectorLayer = new MapboxVectorLayer({
  styleUrl: '/data/styles/bright-v9/style.json',
});
mapboxVectorLayer.setExtent(extent);
const extentLayer = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(fromExtent(extent))],
  }),
  style: {
    'stroke-color': 'cyan',
    'stroke-width': 3,
  },
});

new Map({
  layers: [mapboxVectorLayer, extentLayer],
  target: 'map',
  view: new View({
    center,
    zoom: 16,
  }),
});

render({
  message: 'Vector tile layer clips rendering to the layer extent',
  tolerance: 0.01,
});
