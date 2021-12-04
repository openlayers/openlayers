import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';

const max = 3000;
function normalize(value) {
  return ['/', value, max];
}

const red = normalize(['band', 1]);
const green = normalize(['band', 2]);
const blue = normalize(['band', 3]);
const nir = normalize(['band', 4]);

const trueColor = {
  color: ['array', red, green, blue, 1],
  gamma: 1.1,
};

const falseColor = {
  color: ['array', nir, red, green, 1],
  gamma: 1.1,
};

const ndvi = {
  color: [
    'interpolate',
    ['linear'],
    ['/', ['-', nir, red], ['+', nir, red]],
    // color ramp for NDVI values, ranging from -1 to 1
    -0.2,
    [191, 191, 191],
    -0.1,
    [219, 219, 219],
    0,
    [255, 255, 224],
    0.025,
    [255, 250, 204],
    0.05,
    [237, 232, 181],
    0.075,
    [222, 217, 156],
    0.1,
    [204, 199, 130],
    0.125,
    [189, 184, 107],
    0.15,
    [176, 194, 97],
    0.175,
    [163, 204, 89],
    0.2,
    [145, 191, 82],
    0.25,
    [128, 179, 71],
    0.3,
    [112, 163, 64],
    0.35,
    [97, 150, 54],
    0.4,
    [79, 138, 46],
    0.45,
    [64, 125, 36],
    0.5,
    [48, 110, 28],
    0.55,
    [33, 97, 18],
    0.6,
    [15, 84, 10],
    0.65,
    [0, 69, 0],
  ],
};

const layer = new TileLayer({
  style: trueColor,
  source: new GeoTIFF({
    normalize: false,
    sources: [
      {
        url: 'https://s2downloads.eox.at/demo/EOxCloudless/2020/rgbnir/s2cloudless2020-16bits_sinlge-file_z0-4.tif',
      },
    ],
  }),
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2,
    maxZoom: 6,
  }),
});

const styles = {trueColor, falseColor, ndvi};
const styleSelector = document.getElementById('style');

function update() {
  const style = styles[styleSelector.value];
  layer.setStyle(style);
}
styleSelector.addEventListener('change', update);
