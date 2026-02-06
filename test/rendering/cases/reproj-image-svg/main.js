import {load} from '../../../../src/ol/Image.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import ImageSource from '../../../../src/ol/source/Image.js';
import {createLoader} from '../../../../src/ol/source/static.js';

const source = new ImageSource({
  loader: createLoader({
    url: '/data/cross.svg',
    crossOrigin: '',
    imageExtent: [-10, 50, 10, 70],
    load: load,
  }),
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
    center: fromLonLat([0, 60]),
    zoom: 3,
  }),
});

render({
  tolerance: 0.001,
});
