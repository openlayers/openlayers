import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const center = fromLonLat([8.6, 50.1]);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      }),
    }),
    new VectorLayer({
      style: {
        'icon-src': '/data/icon.png',
        'icon-opacity': 0.5,
        'icon-anchor': [0.5, 46],
        'icon-anchor-x-units': 'fraction',
        'icon-anchor-y-units': 'pixels',
      },
      source: new VectorSource({
        features: [new Feature(new Point(center))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
});

render();
