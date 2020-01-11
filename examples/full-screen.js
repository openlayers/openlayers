import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls, FullScreen} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import XYZ from '../src/ol/source/XYZ.js';


const view = new View({
  center: [-9101767, 2822912],
  zoom: 14
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
        maxZoom: 20
      })
    })
  ],
  target: 'map',
  view: view
});
