import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, XYZ} from '../src/ol/source.js';
import {WebGLTile as TileLayer} from '../src/ol/layer.js';

const variables = {};

// The method used to extract elevations from the DEM.
// In this case the format used is
// red + green * 2 + blue * 3
//
// Other frequently used methods include the Mapbox format
// (red * 256 * 256 + green * 256 + blue) * 0.1 - 10000
// and the Terrarium format
// (red * 256 + green + blue / 256) - 32768
function elevation(xOffset, yOffset) {
  return [
    '+',
    ['*', 256, ['band', 1, xOffset, yOffset]],
    [
      '+',
      ['*', 2 * 256, ['band', 2, xOffset, yOffset]],
      ['*', 3 * 256, ['band', 3, xOffset, yOffset]],
    ],
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
const slope = ['atan', ['^', ['+', ['^', dzdx, 2], ['^', dzdy, 2]], 0.5]];
const aspect = ['clamp', ['atan', ['-', 0, dzdx], dzdy], -Math.PI, Math.PI];
const sunEl = ['*', Math.PI / 180, ['var', 'sunEl']];
const sunAz = ['*', Math.PI / 180, ['var', 'sunAz']];

const cosIncidence = [
  '+',
  ['*', ['sin', sunEl], ['cos', slope]],
  ['*', ['*', ['cos', sunEl], ['sin', slope]], ['cos', ['-', sunAz, aspect]]],
];
const scaled = ['*', 255, cosIncidence];

const shadedRelief = new TileLayer({
  opacity: 0.3,
  source: new XYZ({
    url: 'https://{a-d}.tiles.mapbox.com/v3/aj.sf-dem/{z}/{x}/{y}.png',
  }),
  style: {
    variables: variables,
    color: ['color', scaled, scaled, scaled],
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
    shadedRelief.updateStyleVariables(variables);
  });
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    shadedRelief,
  ],
  view: new View({
    extent: [-13675026, 4439648, -13580856, 4580292],
    center: [-13615645, 4497969],
    minZoom: 10,
    maxZoom: 16,
    zoom: 13,
  }),
});
