import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WebGLVectorLayerRenderer from '../src/ol/renderer/webgl/VectorLayer.js';
import {Draw, Modify, Snap} from '../src/ol/interaction.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

const style = {
  variables: {
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
  },
  'stroke-width': ['var', 'width'],
  'stroke-color': 'rgba(24,86,34,0.7)',
  'stroke-line-dash': [
    ['var', 'dashLength1'],
    ['var', 'dashLength2'],
    ['var', 'dashLength3'],
    ['var', 'dashLength4'],
  ],
  'stroke-line-dash-offset': ['var', 'dashOffset'],
  'stroke-offset': ['var', 'offset'],
  'stroke-line-cap': ['var', 'capType'],
  'stroke-line-join': ['var', 'joinType'],
  'stroke-miter-limit': ['var', 'miterLimit'],
};

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      style,
    });
  }
}

const osm = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource({
  url: 'data/geojson/switzerland.geojson',
  format: new GeoJSON(),
});
const vector = new WebGLLayer({
  source: source,
});

const map = new Map({
  layers: [osm, vector],
  target: 'map',
  view: new View({
    center: fromLonLat([8.43, 46.82]),
    zoom: 7,
  }),
});

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
