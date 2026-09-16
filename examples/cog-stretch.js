import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

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
    variables[channel] = parseInt(selector.value, 10);

    const inputId = `${channel}Max`;
    const input = document.getElementById(inputId);
    variables[inputId] = parseInt(input.value, 10);
  }
  return variables;
}

const layer = new TileLayer({
  style: {
    variables: getVariables(),
    color: [
      'array',
      ['/', ['band', ['var', 'red']], ['var', 'redMax']],
      ['/', ['band', ['var', 'green']], ['var', 'greenMax']],
      ['/', ['band', ['var', 'blue']], ['var', 'blueMax']],
      1,
    ],
  },
  source: new GeoTIFF({
    normalize: false,
    sources: [
      {
        url: 'https://cloudlessdownloads.eox.at/api/public/dl/jvu06wnt/exploitation-ready-epsg-4326/exploitation-ready_eoxcloudless-sentinel-2-2025_zoom-4_4bands_16bit.tif',
      },
    ],
  }),
});

function update() {
  layer.updateStyleVariables(getVariables());
}

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
