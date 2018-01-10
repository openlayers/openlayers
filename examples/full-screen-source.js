import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';


var view = new View({
  center: [-9101767, 2822912],
  zoom: 14
});

var map = new Map({
  controls: defaultControls().extend([
    new FullScreen({
      source: 'fullscreen'
    })
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: view
});
