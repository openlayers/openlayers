import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import Source from '../src/ol/source/ImageTile.js';

const view = new View({
  center: [-9101767, 2822912],
  zoom: 14,
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  controls: defaultControls().extend([new FullScreen()]),
  layers: [
    new Layer({
      source: new Source({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
        maxZoom: 20,
      }),
    }),
  ],
  target: 'map',
  view: view,
});
