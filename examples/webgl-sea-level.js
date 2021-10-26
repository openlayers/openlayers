import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {fromLonLat} from '../src/ol/proj.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

// band math operates on normalized values from 0-1
// so we scale by 255 to align with the elevation formula
// from https://cloud.maptiler.com/tiles/terrain-rgb/
const elevation = [
  '+',
  -10000,
  [
    '*',
    0.1 * 255,
    [
      '+',
      ['*', 256 * 256, ['band', 1]],
      ['+', ['*', 256, ['band', 2]], ['band', 3]],
    ],
  ],
];

const layer = new TileLayer({
  opacity: 0.6,
  source: new XYZ({
    url:
      'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
    maxZoom: 10,
    tileSize: 512,
    crossOrigin: 'anonymous',
  }),
  style: {
    variables: {
      level: 0,
    },
    color: [
      'case',
      // use the `level` style variable to determine the color
      ['<=', elevation, ['var', 'level']],
      [139, 212, 255, 1],
      [139, 212, 255, 0],
    ],
  },
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=' + key,
        attributions: attributions,
        crossOrigin: 'anonymous',
        tileSize: 512,
      }),
    }),
    layer,
  ],
  view: new View({
    center: fromLonLat([-122.3267, 37.8377]),
    zoom: 11,
  }),
});

const control = document.getElementById('level');
const output = document.getElementById('output');
const listener = function () {
  output.innerText = control.value;
  layer.updateStyleVariables({level: parseFloat(control.value)});
};
control.addEventListener('input', listener);
control.addEventListener('change', listener);
output.innerText = control.value;

const locations = document.getElementsByClassName('location');
for (let i = 0, ii = locations.length; i < ii; ++i) {
  locations[i].addEventListener('click', relocate);
}

function relocate(event) {
  const data = event.target.dataset;
  const view = map.getView();
  view.setCenter(fromLonLat(data.center.split(',').map(Number)));
  view.setZoom(Number(data.zoom));
}
