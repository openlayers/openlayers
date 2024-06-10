import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, XYZ} from '../src/ol/source.js';
import {WebGLTile as TileLayer} from '../src/ol/layer.js';

const variables = {};

// The method used to extract elevations from the DEM.
// In this case the format used is Terrarium
// red * 256 + green + blue / 256 - 32768
//
// Other frequently used methods include the Mapbox format
// (red * 256 * 256 + green * 256 + blue) * 0.1 - 10000
//
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

// Edges conditions to avoid computations with pixels ouside the current tile.
const isLeftEdge = ['<=', ['tileCoordX'], 1];
const isRightEdge = ['>=', ['tileCoordX'], ['-', ['tileMaxCoordX'], 1]];
const isTopEdge = ['<=', ['tileCoordY'], 1];
const isBottomEdge = ['>=', ['tileCoordY'], ['-', ['tileMaxCoordY'], 1]];

// Computes the vertical and horizontal values for slope and aspect.
// Avoid computation with pixels outside the current tile.
const dpx = [
  'case',
  ['any', isLeftEdge, isRightEdge],
  ['*', 1, ['resolution']],
  ['*', 2, ['resolution']],
];

const dpy = [
  'case',
  ['any', isTopEdge, isBottomEdge],
  ['*', 1, ['resolution']],
  ['*', 2, ['resolution']],
];

const z0x = [
  'case',
  isLeftEdge,
  ['*', ['var', 'vert'], elevation(0, 0)],
  ['*', ['var', 'vert'], elevation(-1, 0)],
];
const z1x = [
  'case',
  isRightEdge,
  ['*', ['var', 'vert'], elevation(0, 0)],
  ['*', ['var', 'vert'], elevation(1, 0)],
];

const z0y = [
  'case',
  isTopEdge,
  ['*', ['var', 'vert'], elevation(0, 0)],
  ['*', ['var', 'vert'], elevation(0, -1)],
];
const z1y = [
  'case',
  isBottomEdge,
  ['*', ['var', 'vert'], elevation(0, 0)],
  ['*', ['var', 'vert'], elevation(0, 1)],
];

// Generates a shaded relief image given elevation data.  Uses a 3x3
// neighborhood for determining slope and aspect.
const dzdx = ['/', ['-', z1x, z0x], dpx];
const dzdy = ['/', ['-', z1y, z0y], dpy];
const slope = ['atan', ['sqrt', ['+', ['^', dzdx, 2], ['^', dzdy, 2]]]];
const aspect = ['clamp', ['atan', ['-', 0, dzdx], dzdy], -Math.PI, Math.PI];
const sunEl = ['*', Math.PI / 180, ['var', 'sunEl']];
const sunAz = ['*', Math.PI / 180, ['var', 'sunAz']];

const cosIncidence = [
  '+',
  ['*', ['sin', sunEl], ['cos', slope]],
  ['*', ['cos', sunEl], ['sin', slope], ['cos', ['-', sunAz, aspect]]],
];
const scaled = ['*', 255, cosIncidence];

const shadedRelief = new TileLayer({
  opacity: 0.3,
  source: new XYZ({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    maxZoom: 15,
    interpolate: false, // Enabling interpolation may create artifacts between tiles.
    attributions:
      '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Data sources and attribution</a>',
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
    center: [-13615645, 4497969],
    zoom: 13,
  }),
});
