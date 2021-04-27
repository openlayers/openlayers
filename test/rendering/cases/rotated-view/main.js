import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import View from '../../../../src/ol/View.js';
import {
  Tile as TileLayer,
  Vector as VectorLayer,
} from '../../../../src/ol/layer.js';
import {Vector as VectorSource, XYZ} from '../../../../src/ol/source.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

const center = fromLonLat([-111, 45.7]);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      }),
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [new Feature(new Point(center))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
    rotation: Math.PI / 4,
  }),
});

render();
