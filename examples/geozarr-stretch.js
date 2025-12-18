import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
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
  url: 'https://s3.explorer.eopf.copernicus.eu/esa-zarr-sentinel-explorer-fra/tests-output/sentinel-2-l2a-staging/S2B_MSIL2A_20251115T091139_N0511_R050_T35SLU_20251115T111807.zarr',
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
  view: getView(source, withHigherResolutions(2), withExtentCenter()),
});
