/* global pmtiles */
import CompositeTile from '../src/ol/source/CompositeTile.js';
import DataTile from '../src/ol/source/DataTile.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const tiles = new pmtiles.PMTiles(
  'https://pub-9288c68512ed46eca46ddcade307709b.r2.dev/protomaps-sample-datasets/terrarium_z9.pmtiles',
);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('load failed')));
    img.src = src;
  });
}

async function loader(z, x, y) {
  const response = await tiles.getZxy(z, x, y);
  const blob = new Blob([response.data]);
  const src = URL.createObjectURL(blob);
  const image = await loadImage(src);
  URL.revokeObjectURL(src);
  return image;
}

const layer = new TileLayer({
  source: new CompositeTile({
    sources: [
      new OSM(),
      new DataTile({
        loader,
        wrapX: true,
        maxZoom: 9,
        attributions:
          "<a href='https://github.com/tilezen/joerd/blob/master/docs/attribution.md#attribution'>Tilezen Jörð</a>",
      }),
    ],
  }),
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

function getElevation(data) {
  const red = data[4];
  const green = data[5];
  const blue = data[6];
  return red * 256 + green + blue / 256 - 32768;
}

function formatLocation([lon, lat]) {
  const NS = lat < 0 ? 'S' : 'N';
  const EW = lon < 0 ? 'W' : 'E';
  return `${Math.abs(lat).toFixed(1)}° ${NS}, ${Math.abs(lon).toFixed(
    1,
  )}° ${EW}`;
}

const elevationOut = document.getElementById('elevationOut');
const locationOut = document.getElementById('locationOut');
function displayPixelValue(event) {
  const data = layer.getData(event.pixel);
  if (!data) {
    return;
  }
  elevationOut.innerText = getElevation(data).toLocaleString() + ' m';
  locationOut.innerText = formatLocation(event.coordinate);
}
map.on(['pointermove', 'click'], displayPixelValue);
