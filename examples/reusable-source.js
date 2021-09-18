import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';
const baseUrl = 'https://{a-c}.tiles.mapbox.com/v4';
const urls = [
  baseUrl + '/mapbox.blue-marble-topo-jan/{z}/{x}/{y}.png?access_token=' + key,
  baseUrl +
    '/mapbox.blue-marble-topo-bathy-jan/{z}/{x}/{y}.png?access_token=' +
    key,
  baseUrl + '/mapbox.blue-marble-topo-jul/{z}/{x}/{y}.png?access_token=' + key,
  baseUrl +
    '/mapbox.blue-marble-topo-bathy-jul/{z}/{x}/{y}.png?access_token=' +
    key,
];

const source = new XYZ();

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

function updateUrl(index) {
  source.setUrl(urls[index]);
}

const buttons = document.getElementsByClassName('switcher');
for (let i = 0, ii = buttons.length; i < ii; ++i) {
  const button = buttons[i];
  button.addEventListener('click', updateUrl.bind(null, Number(button.value)));
}

updateUrl(0);
