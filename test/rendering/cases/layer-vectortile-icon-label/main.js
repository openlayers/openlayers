import Map from '../../../../src/ol/Map.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import View from '../../../../src/ol/View.js';
import {applyBackground, applyStyle} from 'ol-mapbox-style';

const mapboxVectorLayer = new VectorTileLayer({declutter: true});
applyStyle(mapboxVectorLayer, '/data/styles/bright-v9/style.json');
applyBackground(mapboxVectorLayer, '/data/styles/bright-v9/style.json');

new Map({
  layers: [mapboxVectorLayer],
  target: 'map',
  view: new View({
    center: [1822585.77586262, 6141438.140891937],
    zoom: 16,
  }),
});

setTimeout(() => {
  // wait until fonts are loaded
  render({
    message: 'Vector tile layer declutters image with text correctly',
    tolerance: 0.01,
  });
}, 500);
