import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {useGeographic} from '../src/ol/proj.js';
import SentinelHub from '../src/ol/source/SentinelHub.js';

useGeographic();

const source = new SentinelHub({
  evalscript: {
    setup: () => ({
      input: ['B02', 'B03', 'B04'],
      output: {bands: 3},
    }),
    evaluatePixel: (sample) => [3 * sample.B04, 3 * sample.B03, 3 * sample.B02],
  },
});

const map = new Map({
  layers: [new TileLayer({source})],
  target: 'map',
  view: new View({
    center: [-108.6, 43.185],
    zoom: 12,
    minZoom: 7,
    maxZoom: 13,
  }),
});

document.getElementById('auth-form').addEventListener('submit', (event) => {
  const clientId = event.target.elements['id'].value;
  const clientSecret = event.target.elements['secret'].value;
  source.setAuth({clientId, clientSecret});
});

const picker = document.getElementById('to-date');

function updateInputData() {
  const toDate = new Date(picker.value);
  const fromDate = new Date(toDate.getTime());
  fromDate.setDate(fromDate.getDate() - 7);

  source.setData([
    {
      type: 'sentinel-2-l2a',
      dataFilter: {
        timeRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      },
    },
  ]);
}

picker.addEventListener('change', () => updateInputData());
updateInputData();

source.on('change', () => {
  if (source.getState() === 'error') {
    alert(source.getError());
  }
});
