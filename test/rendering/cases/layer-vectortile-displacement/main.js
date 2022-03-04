import MVT from '../../../../src/ol/format/MVT.js';
import Map from '../../../../src/ol/Map.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import View from '../../../../src/ol/View.js';
import {Fill, Style} from '../../../../src/ol/style.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const shadow = new Style({
  fill: new Fill({
    color: '#ff0000',
  }),
});

const building = new Style({
  fill: new Fill({
    color: '#000000',
  }),
});

const source = new VectorTileSource({
  format: new MVT(),
  tileGrid: createXYZ(),
  url: '/data/tiles/diagonal-bank-streets/{z}/{x}/{y}.mvt',
  transition: 0,
});

new Map({
  layers: [
    new VectorTileLayer({
      source: source,
      style: function (feature) {
        if (feature.get('layer') == 'building') {
          return shadow;
        }
      },
      background: '#ffffff',
      displacement: [4, 4],
    }),
    new VectorTileLayer({
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
    center: [-11312.28665441246, 6712595.978007351],
    zoom: 16,
  }),
});

render({
  message: 'Vector tile layer shadow renders',
  tolerance: 0.02,
});
