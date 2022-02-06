import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {useGeographic} from '../../../../src/ol/proj.js';
useGeographic();

new Map({
  layers: [
    new TileLayer({
      extent: [-100, -30, 50, 50],
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
    rotation: Math.PI / 5,
  }),
});

render({
  message: 'data outside the layer extent is not rendered',
});
