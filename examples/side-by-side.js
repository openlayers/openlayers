import ImageTile from '../src/ol/source/ImageTile.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const roadLayer = new TileLayer({
  source: new ImageTile({
    attributions: attributions,
    url: 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
    maxZoom: 22,
  }),
});

const aerialLayer = new TileLayer({
  source: new ImageTile({
    attributions: attributions,
    url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
    tileSize: 512,
    maxZoom: 20,
  }),
});

const view = new View({
  center: [-6655.5402445057125, 6709968.258934638],
  zoom: 13,
});

const map1 = new Map({
  target: 'roadMap',
  layers: [roadLayer],
  view: view,
});

const map2 = new Map({
  target: 'aerialMap',
  layers: [aerialLayer],
  view: view,
});
