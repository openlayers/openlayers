import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {fromLonLat} from '../src/ol/proj.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const shadow = new Style({
  fill: new Fill({
    color: '#9ba4c9',
  }),
});

const building = new Style({
  fill: new Fill({
    color: '#f8f8f8',
  }),
  stroke: new Stroke({
    color: '#c6cbdc',
    width: 1,
  }),
});

const source = new VectorTileSource({
  attributions:
    '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
    '© <a href="https://www.openstreetmap.org/copyright">' +
    'OpenStreetMap contributors</a>',
  format: new MVT(),
  url:
    'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
    '{z}/{x}/{y}.vector.pbf?access_token=' +
    key,
});

const map = new Map({
  layers: [
    new VectorTileLayer({
      declutter: true,
      source: source,
      style: function (feature) {
        if (feature.get('layer') == 'building') {
          return shadow;
        }
      },
      background: '#edeff7',
      displacement: [2, 2],
    }),
    new VectorTileLayer({
      declutter: true,
      source: source,
      style: function (feature) {
        if (feature.get('layer') == 'building') {
          return building;
        }
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-0.1, 51.5135]),
    zoom: 18,
  }),
});
