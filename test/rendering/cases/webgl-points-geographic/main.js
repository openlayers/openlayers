import {Point} from '../../../../src/ol/geom.js';
import {Feature, Map, View} from '../../../../src/ol/index.js';
import {Tile as TileLayer, WebGLVector} from '../../../../src/ol/layer.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import {Vector as VectorSource, XYZ} from '../../../../src/ol/source.js';

useGeographic();

const center = [8.6, 50.1];

const point = new Point(center);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
    new WebGLVector({
      source: new VectorSource({
        features: [new Feature(point)],
      }),
      style: {
        'icon-src': '/data/icon.png',
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
});

render();
