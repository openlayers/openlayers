import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import View from '../src/ol/View.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';

const layers = [
  new TileLayer({
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {
        'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
        'TILED': true,
      },
    }),
  }),
];

const map = new Map({
  controls: defaultControls().extend([
    new ScaleLine({
      units: 'degrees',
    }),
  ]),
  layers: layers,
  target: 'map',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2,
  }),
});
