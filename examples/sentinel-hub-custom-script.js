import {javascript} from '@codemirror/lang-javascript';
import {EditorView, basicSetup} from 'codemirror';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {useGeographic} from '../src/ol/proj.js';
import SentinelHub from '../src/ol/source/SentinelHub.js';

useGeographic();

const source = new SentinelHub({
  data: [
    {
      type: 'sentinel-2-l2a',
      dataFilter: {
        timeRange: {
          from: '2024-05-15T00:00:00Z',
          to: '2024-05-25T00:00:00Z',
        },
      },
    },
  ],
});

const map = new Map({
  layers: [new TileLayer({source})],
  target: 'map',
  view: new View({
    center: [30.674, 29.935],
    zoom: 10,
    minZoom: 13,
    maxZoom: 15,
  }),
});

document.getElementById('auth-form').addEventListener('submit', (event) => {
  const clientId = event.target.elements['id'].value;
  const clientSecret = event.target.elements['secret'].value;
  source.setAuth({clientId, clientSecret});
});

const script = `//VERSION=3
function setup() {
  return {
    input: ['B02', 'B03', 'B04', 'B08', 'B11'],
    output: {bands: 3},
  };
}

function evaluatePixel(sample) {
  // Normalized Difference Moisture Index
  const ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
  if (ndmi <= 0) {
    return [3 * sample.B04, 3 * sample.B03, 3 * sample.B02];
  }
  if (ndmi <= 0.2) {
    return [0, 0.8, 0.9];
  }
  if (ndmi <= 0.4) {
    return [0, 0.5, 0.9];
  }
  return [0, 0, 0.7];
}`;

const editor = new EditorView({
  doc: script,
  extensions: [basicSetup, javascript()],
  parent: document.getElementById('evalscript'),
});

document
  .getElementById('evalscript-form')
  .addEventListener('submit', (event) => {
    event.preventDefault();
    source.setEvalscript(editor.state.doc.toString());
  });

source.setEvalscript(script);

source.on('change', () => {
  if (source.getState() === 'error') {
    alert(source.getError());
  }
});
