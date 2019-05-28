import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import MVT from '../../../src/ol/format/MVT.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import VectorTileLayer from '../../../src/ol/layer/VectorTile.js';

new Map({
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

render({
  message: 'Vector tile layer renders',
  tolerance: 0.01
});
