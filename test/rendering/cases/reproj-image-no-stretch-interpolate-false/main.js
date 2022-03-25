import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import View from '../../../../src/ol/View.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

const source = new Static({
  url: '/data/tiles/osm/5/5/12.png',
  imageExtent: [-123, 37, -122, 38],
  interpolate: false,
  projection: 'EPSG:4326',
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
    center: fromLonLat([-122.39, 37.81]),
    zoom: 12,
  }),
});

render({
  tolerance: 0.001,
});
