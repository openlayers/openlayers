import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import View from '../../../../src/ol/View.js';
import {
  get as getProjection,
  transformExtent,
} from '../../../../src/ol/proj.js';

const source = new Static({
  url: '/data/tiles/osm/5/5/12.png',
  imageExtent: transformExtent([-123, 37, -122, 38], 'EPSG:4326', 'EPSG:3857'),
  interpolate: false,
  projection: getProjection('EPSG:3857'),
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
