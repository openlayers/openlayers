import ImageLayer from '../../../../src/ol/layer/Image.js';
import ImageSource from '../../../../src/ol/source/Image.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {createLoader} from '../../../../src/ol/source/static.js';
import {svgLoad} from '../../../../src/ol/Image.js';

const source = new ImageSource({
  loader: createLoader({
    url: '/data/tiger.svg',
    crossOrigin: '',
    imageExtent: [-123, 37, -122, 38],
    load: svgLoad,
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
    center: [-122.39, 37.81],
    zoom: 12,
    projection: 'EPSG:4326',
  }),
});

render({
  tolerance: 0.001,
});
