import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import DragRotateAndZoom from '../src/ol/interaction/DragRotateAndZoom.js';
import TileLayer from '../src/ol/layer/Tile.js';
import BingMaps from '../src/ol/source/BingMaps.js';


var map = new Map({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  interactions: defaultInteractions().extend([
    new DragRotateAndZoom()
  ]),
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  // Use the canvas renderer because it's currently the fastest
  target: 'map',
  view: new View({
    center: [-33519607, 5616436],
    rotation: -Math.PI / 8,
    zoom: 8
  })
});
