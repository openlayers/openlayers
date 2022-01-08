import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {Fill, Stroke, Style} from '../../../../src/ol/style.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
    new VectorLayer({
      background: '#a9d3df',
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#ccc',
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    }),
  ],
});

render();
