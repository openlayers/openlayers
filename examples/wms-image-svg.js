import ImageSource from '../src/ol/source/Image.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import View from '../src/ol/View.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {createLoader} from '../src/ol/source/wms.js';
import {load} from '../src/ol/Image.js';

const layers = [
  new TileLayer({
    source: new OSM(),
  }),
  new ImageLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new ImageSource({
      loader: createLoader({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {'LAYERS': 'topp:states', 'FORMAT': 'image/svg+xml'},
        ratio: 1,
        load: load,
      }),
    }),
  }),
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
  }),
});
