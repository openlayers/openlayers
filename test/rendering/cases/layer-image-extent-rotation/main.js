import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import View from '../../../../src/ol/View.js';
import {
  get as getProjection,
  transform,
  transformExtent,
} from '../../../../src/ol/proj.js';
const center = transform([-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857');
const extent = transformExtent(
  [-123.1, 37.1, -122.1, 37.9],
  'EPSG:4326',
  'EPSG:3857'
);

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new ImageLayer({
      source: new Static({
        url: '/data/tiles/osm/5/5/12.png',
        imageExtent: transformExtent(
          [-123, 37, -122, 38],
          'EPSG:4326',
          'EPSG:3857'
        ),
        projection: getProjection('EPSG:3857'),
      }),
      extent,
    }),
  ],
  view: new View({
    center,
    zoom: 8,
    rotation: Math.PI / 4,
  }),
});

render();
