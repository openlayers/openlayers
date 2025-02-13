import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageTile from '../src/ol/source/ImageTile.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const url =
  'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=' + key;

const withTransition = new TileLayer({
  source: new ImageTile({url: url, tileSize: 512, attributions: attributions}),
});

const withoutTransition = new TileLayer({
  source: new ImageTile({
    url: url,
    transition: 0,
    tileSize: 512,
    attributions: attributions,
  }),
  visible: false,
});

const map = new Map({
  layers: [withTransition, withoutTransition],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    maxZoom: 11,
  }),
});

document
  .getElementById('transition')
  .addEventListener('change', function (event) {
    const transition = event.target.checked;
    withTransition.setVisible(transition);
    withoutTransition.setVisible(!transition);
  });
