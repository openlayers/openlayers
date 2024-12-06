import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {createCanvasContext2D} from '../../../../src/ol/dom.js';
import {memoizeOne} from '../../../../src/ol/functions.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import Image from '../../../../src/ol/source/Image.js';
import {createLoader as createWMSLoader} from '../../../../src/ol/source/wms.js';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333' +
    ' +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel ' +
    '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
);
register(proj4);

const imageWms = new Image({
  loader: (...args) =>
    memoizeOne(
      createWMSLoader({
        params: {
          'LAYERS': 'post_office',
        },
        projection: 'EPSG:2056',
        url: '/data/tiles/wms/epsg2056.png',
      }),
    )(...args).then(({image}) => {
      const context = createCanvasContext2D(256, 256);
      context.drawImage(image, 256, 256, 256, 256, 0, 0, 256, 256);
      return context.canvas;
    }),
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
