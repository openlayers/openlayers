import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const view = new View({
  center: [-9101767, 2822912],
  zoom: 14,
});

const map = new Map({
  controls: defaultControls().extend([
    new FullScreen({
      source: 'fullscreen',
    }),
  ]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: view,
});
