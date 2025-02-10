import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import ImageSource from '../src/ol/source/Image.js';
import {createLoader} from '../src/ol/source/wms.js';

const layer = new ImageLayer({
  source: new ImageSource({
    loader: createLoader({
      url: 'https://demo.mapserver.org/cgi-bin/wms?',
      params: {
        LAYERS: ['bluemarble,country_bounds,cities'],
        VERSION: '1.3.0',
        FORMAT: 'image/png',
      },
      projection: 'EPSG:4326',
      // note serverType only needs to be set when hidpi is true
      hidpi: true,
      serverType: 'mapserver',
    }),
  }),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2,
  }),
});
