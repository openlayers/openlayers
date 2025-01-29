import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import ImageLayer from '../src/ol/layer/Image.js';
import ImageSource from '../src/ol/source/Image.js';
import {createLoader} from '../src/ol/source/mapserver.js';

const mapserverUrl = 'https://demo.mapserver.org/cgi-bin/mapserv?';
const bounds = [388039, 5234969, 500964, 5295764];
const mapServerLayer = new ImageLayer({
  extent: bounds,
  source: new ImageSource({
    loader: createLoader({
      url: mapserverUrl,
      params: {
        'map': '/mapserver/apps/itasca_legend/map/itasca3.map',
        'layers': 'boundaries water roads other cities',
      },
    }),
  }),
});

const map = new Map({
  layers: [mapServerLayer],
  target: 'map',
  view: new View({
    center: getCenter(bounds),
    zoom: 10,
  }),
});
