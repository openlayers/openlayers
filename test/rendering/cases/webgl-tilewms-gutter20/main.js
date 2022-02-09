import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import TileWMS from '../../../../src/ol/source/TileWMS.js';
import View from '../../../../src/ol/View.js';

const tileWms = new TileWMS({
  params: {
    'LAYERS': 'layer',
  },
  gutter: 20,
  url: '/data/tiles/wms/wms20.png',
  transition: 0,
});

new Map({
  pixelRatio: 1.5,
  layers: [new TileLayer({source: tileWms})],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 5,
  }),
});

render();
