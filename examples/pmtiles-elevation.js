import {PMTiles} from 'pmtiles';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {useGeographic} from '../src/ol/proj.js';
import DataTile from '../src/ol/source/DataTile.js';

useGeographic();

const tiles = new PMTiles(
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

async function loader(z, x, y, {signal}) {
  const response = await tiles.getZxy(z, x, y, signal);
  const blob = new Blob([response.data]);
  const src = URL.createObjectURL(blob);
  const image = await loadImage(src);
  URL.revokeObjectURL(src);
  return image;
}

// The method used to extract elevations from the DEM.
//   red * 256 + green + blue / 256 - 32768
function elevation(xOffset, yOffset) {
  const red = ['band', 1, xOffset, yOffset];
  const green = ['band', 2, xOffset, yOffset];
  const blue = ['band', 3, xOffset, yOffset];

  // band math operates on normalized values from 0-1
  // so we scale by 255
  return [
    '+',
    ['*', 255 * 256, red],
    ['*', 255, green],
    ['*', 255 / 256, blue],
    -32768,
  ];
}

// Generates a shaded relief image given elevation data.  Uses a 3x3
// neighborhood for determining slope and aspect.
const dp = ['*', 2, ['resolution']];
const z0x = ['*', ['var', 'vert'], elevation(-1, 0)];
const z1x = ['*', ['var', 'vert'], elevation(1, 0)];
const dzdx = ['/', ['-', z1x, z0x], dp];
const z0y = ['*', ['var', 'vert'], elevation(0, -1)];
const z1y = ['*', ['var', 'vert'], elevation(0, 1)];
const dzdy = ['/', ['-', z1y, z0y], dp];
const slope = ['atan', ['sqrt', ['+', ['^', dzdx, 2], ['^', dzdy, 2]]]];
const aspect = ['clamp', ['atan', ['-', 0, dzdx], dzdy], -Math.PI, Math.PI];
const sunEl = ['*', Math.PI / 180, ['var', 'sunEl']];
const sunAz = ['*', Math.PI / 180, ['var', 'sunAz']];

const incidence = [
  '+',
  ['*', ['sin', sunEl], ['cos', slope]],
  ['*', ['cos', sunEl], ['sin', slope], ['cos', ['-', sunAz, aspect]]],
];
const scaled = ['*', 255, incidence];

const variables = {};

const layer = new TileLayer({
  source: new DataTile({
    loader,
    wrapX: true,
    maxZoom: 9,
    attributions:
      "<a href='https://github.com/tilezen/joerd/blob/master/docs/attribution.md#attribution'>Tilezen Jörð</a>",
  }),
  style: {
    variables: variables,
    color: ['color', scaled],
  },
});

const controlIds = ['vert', 'sunEl', 'sunAz'];
controlIds.forEach(function (id) {
  const control = document.getElementById(id);
  const output = document.getElementById(id + 'Out');
  function updateValues() {
    output.innerText = control.value;
    variables[id] = Number(control.value);
  }
  updateValues();
  control.addEventListener('input', function () {
    updateValues();
    layer.updateStyleVariables(variables);
  });
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
  const red = data[0];
  const green = data[1];
  const blue = data[2];
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
