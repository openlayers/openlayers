import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import TileLayer from '../src/ol/layer/Tile.js';
import BingMaps from '../src/ol/source/BingMaps.js';


var view = new View({
  center: [-9101767, 2822912],
  zoom: 14
});

var map = new Map({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map',
  view: view
});
