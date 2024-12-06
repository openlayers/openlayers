import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import ImageWMS from '../../../../src/ol/source/ImageWMS.js';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333' +
    ' +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel ' +
    '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
);
register(proj4);

const imageWms = new ImageWMS({
  params: {
    'LAYERS': 'post_office',
  },
  url: '/data/tiles/wms/epsg2056.png',
  ratio: 767 / 256,
});

new Map({
  pixelRatio: 1,
  layers: [new ImageLayer({source: imageWms})],
  target: 'map',
  view: new View({
    center: [2535000, 1153000],
    resolution: 2,
    projection: 'EPSG:2056',
  }),
});

render();
