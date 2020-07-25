import ImageLayer from '../../../src/ol/layer/Image.js';
import Map from '../../../src/ol/Map.js';
import Static from '../../../src/ol/source/ImageStatic.js';
import View from '../../../src/ol/View.js';
import {fromLonLat, transformExtent} from '../../../src/ol/proj.js';

const source = new Static({
  url: '/data/tiles/osm/5/5/12.png',
  imageExtent: transformExtent([-123, 37, -122, 38], 'EPSG:4326', 'EPSG:3857'),
  imageSmoothing: false,
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new ImageLayer({
      source: source,
    }),
  ],
  view: new View({
    center: fromLonLat([-122.416667, 37.783333]),
    zoom: 12,
  }),
});

render({
  tolerance: 0.001,
});
