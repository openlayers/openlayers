import ColorTile from '../src/ol/source/ColorTile.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const colorTile = new ColorTile();

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),

    new TileLayer({
      source: colorTile,
      opacity: 0.5,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const select = document.getElementById('select');
if (select) {
  select.addEventListener('change', () => {
    colorTile.setColor(select.value);
  });
}
