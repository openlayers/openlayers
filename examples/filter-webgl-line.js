import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {Draw, Modify, Snap} from '../src/ol/interaction.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

/**
 * @type {import('../src/ol/style/webgl.js').WebGLStyle}
 */
let style;

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      style,
    });
  }
}

const source = new VectorSource({
  url: 'data/geojson/switzerland-m-metric.geojson',
  format: new GeoJSON(),
});

/**
 * @return {import('../src/ol/style/webgl.js').WebGLStyle} Generated style
 */
const getStyle = () => {
  return {
    variables: style
      ? style.variables
      : {
          width: 12,
          offset: 0,
          capType: 'butt',
          joinType: 'miter',
          miterLimit: 10, // ratio
          dashLength1: 25,
          dashLength2: 15,
          dashLength3: 15,
          dashLength4: 15,
          dashOffset: 0,
          patternSpacing: 0,
          minT: 31,
          maxT: 208,
        },
    'stroke-width': ['var', 'width'],
    'stroke-color': 'rgb(126,35,144, 0.8)',
    'stroke-offset': ['var', 'offset'],
    'stroke-miter-limit': ['var', 'miterLimit'],
    'stroke-line-cap': ['var', 'capType'],
    'stroke-line-join': ['var', 'joinType'],
    filter: [
      'all',
      ['>=', ['line-metric'], ['var', 'minT']],
      ['<=', ['line-metric'], ['var', 'maxT']],
    ],
  };
};

style = getStyle();

let vectorLayer = new WebGLLayer({
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
    center: fromLonLat([8.43, 46.82]),
    zoom: 7,
  }),
});

const rebuildStyle = () => {
  const dash = document.getElementById('dashEnable').checked;
  const pattern = document.getElementById('patternEnable').checked;
  style = getStyle(dash, pattern);
  map.removeLayer(vectorLayer);
  vectorLayer = new WebGLLayer({
    source,
  });
  map.addLayer(vectorLayer);
};

const modify = new Modify({source: source});
map.addInteraction(modify);

let draw, snap; // global so we can remove them later

function addInteractions() {
  draw = new Draw({
    source: source,
    type: 'LineString',
  });
  map.addInteraction(draw);
  snap = new Snap({source: source});
  map.addInteraction(snap);
}

addInteractions();

const inputListener = (event) => {
  const variables = style.variables;
  const variableName = event.target.name;
  if (event.target.type === 'radio') {
    variables[variableName] = event.target.value;
  } else {
    variables[variableName] = parseFloat(event.target.value);
  }
  const valueSpan = document.getElementById(`value-${variableName}`);
  if (valueSpan) {
    valueSpan.textContent = variables[variableName];
  }
  map.render();
};
document
  .querySelectorAll('input.uniform')
  .forEach((input) => input.addEventListener('input', inputListener));
document
  .querySelectorAll('input.rebuild')
  .forEach((input) => input.addEventListener('input', rebuildStyle));
