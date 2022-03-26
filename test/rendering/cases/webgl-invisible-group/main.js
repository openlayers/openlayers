import Group from '../../../../src/ol/layer/Group.js';
import Map from '../../../../src/ol/Map.js';
import OSM from '../../../../src/ol/source/OSM.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

new Map({
  layers: [
    new Group({
      visible: false,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message: 'webgl tile layer in an invisible group is not rendered',
});
