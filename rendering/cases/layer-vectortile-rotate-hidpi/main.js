import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorTileSource from '../../../src/ol/source/VectorTile';
import MVT from '../../../src/ol/format/MVT';
import {createXYZ} from '../../../src/ol/tilegrid';
import VectorTileLayer from '../../../src/ol/layer/VectorTile';

const map = new Map({
  pixelRatio: 2,
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: createXYZ(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        transition: 0
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 14
  })
});

map.getView().setRotation(Math.PI / 4);
render({
  message: 'Vector tile layer rotates (hidip)',
  tolerance: 0.01
});
