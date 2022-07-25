import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const notInterpolated = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url:
      'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
    maxZoom: 12,
    crossOrigin: '',
    interpolate: false,
  }),
});

const interpolated = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url:
      'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
    maxZoom: 12,
    crossOrigin: '',
  }),
});

const view = new View({
  center: [6.893, 45.8295],
  zoom: 16,
  projection: 'EPSG:4326',
});

const map1 = new Map({
  target: 'map1',
  layers: [notInterpolated],
  view: view,
});

const map2 = new Map({
  target: 'map2',
  layers: [interpolated],
  view: view,
});

function getHeight(rgba) {
  return -10000 + (rgba[0] * 256 * 256 + rgba[1] * 256 + rgba[2]) * 0.1;
}

const info1 = document.getElementById('info1');
const info2 = document.getElementById('info2');
const showElevations = function (evt) {
  if (evt.dragging) {
    return;
  }
  const notInterpolatedPixel = notInterpolated.getData(evt.pixel);
  info1.innerText = notInterpolatedPixel
    ? getHeight(notInterpolatedPixel).toFixed(1)
    : '-';

  const interpolatedPixel = interpolated.getData(evt.pixel);
  info2.innerText = interpolatedPixel
    ? getHeight(interpolatedPixel).toFixed(1)
    : '-';
};

map1.on('pointermove', showElevations);
map2.on('pointermove', showElevations);
