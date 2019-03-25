import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import Zoomify from '../../../src/ol/source/Zoomify.js';

const layer = new TileLayer({
  source: new Zoomify({
    url: '/data/tiles/zoomify/',
    size: [200, 200],
    tileSize: 100
  })
});

new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    resolutions: [2, 1],
    center: [100, -100],
    zoom: 0.4
  })
});

render();
