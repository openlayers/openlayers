import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
  withZoom,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const channels = ['red', 'green', 'blue'];
for (const channel of channels) {
  const selector = document.getElementById(channel);
  selector.addEventListener('change', update);

  const input = document.getElementById(`${channel}Max`);
  input.addEventListener('input', update);
}

function getVariables() {
  const variables = {};
  for (const channel of channels) {
    const selector = document.getElementById(channel);
    variables[channel] = parseFloat(selector.value);

    const inputId = `${channel}Max`;
    const input = document.getElementById(inputId);
    variables[inputId] = parseFloat(input.value);
  }
  return variables;
}

const source = new GeoZarr({
  url: 'https://storage.googleapis.com/open-cogs/geozarr/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420.zarr',
  group: 'measurements/reflectance',
  bands: ['b04', 'b03', 'b02', 'b05'],
});

const layer = new TileLayer({
  style: {
    variables: getVariables(),
    gamma: 1.5,
    color: [
      'array',
      ['/', ['band', ['var', 'red']], ['var', 'redMax']],
      ['/', ['band', ['var', 'green']], ['var', 'greenMax']],
      ['/', ['band', ['var', 'blue']], ['var', 'blueMax']],
      [
        'case',
        [
          '==',
          [
            '+',
            ['band', ['var', 'red']],
            ['band', ['var', 'green']],
            ['band', ['var', 'blue']],
          ],
          0,
        ],
        0,
        1,
      ],
    ],
  },
  source,
});

function update() {
  layer.updateStyleVariables(getVariables());
}

const map = new Map({
  target: 'map',
  layers: [new TileLayer({source: new OSM()}), layer],
  view: getView(
    source,
    withLowerResolutions(1),
    withHigherResolutions(1),
    withExtentCenter(),
    withZoom(3),
  ),
});
