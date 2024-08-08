import IGC from '../src/ol/format/IGC.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer} from '../src/ol/layer.js';

const lineStyle = {
  variables: {
    timestamp: 1303240000,
  },
  'stroke-width': 4,
  'stroke-color': [
    'interpolate',
    ['linear'],
    ['line-metric'],
    1303200000,
    'hsl(312,100%,39%)',
    1303240000,
    'hsl(36,100%,45%)',
  ],
  filter: ['<=', ['line-metric'], ['var', 'timestamp']],
};

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      style: lineStyle,
    });
  }
}

const igcUrls = [
  'data/igc/Clement-Latour.igc',
  'data/igc/Damien-de-Baenst.igc',
  'data/igc/Sylvain-Dhonneur.igc',
  'data/igc/Tom-Payne.igc',
  'data/igc/Ulrich-Prinz.igc',
];

const source = new VectorSource({
  features: [],
});

const format = new IGC();
for (let i = 0; i < igcUrls.length; ++i) {
  fetch(igcUrls[i])
    .then((resp) => resp.text())
    .then((data) => {
      const features = format.readFeatures(data, {
        featureProjection: 'EPSG:3857',
      });
      source.addFeatures(features);
    });
}

const vectorLayer = new WebGLLayer({
  source,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  target: 'map',
  view: new View({
    center: [703365.7089403362, 5714629.865071137],
    zoom: 9,
  }),
});

function showTime() {
  const time = new Date(lineStyle.variables.timestamp * 1000);
  document.getElementById('time-value').textContent = time.toUTCString();
}
document.getElementById('time-input').addEventListener('input', (event) => {
  lineStyle.variables.timestamp = parseFloat(event.target.value);
  showTime();
  map.render();
});
showTime();
