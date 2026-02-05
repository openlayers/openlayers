import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {transformExtent} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
    rotation: Math.PI / 4,
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      }),
    }),
    new VectorLayer({
      declutter: true,
      extent: transformExtent([-50, -45, 50, 45], 'EPSG:4326', 'EPSG:3857'),
      style: {
        'stroke-color': 'cyan',
        'stroke-width': 3,
      },
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
    }),
  ],
});

render();
