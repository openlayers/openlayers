import Feature from '../../../../src/ol/Feature.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';

const openLine = new Feature({
  geometry: new LineString([
    [-90, -80],
    [-20, -80],
    [-20, 30],
    [-70, 40],
    [-20, 80],
    [-90, 80],
    [-110, 35],
    [-90, -50],
    [-60, -50],
  ]),
  lineColor: 'rgba(80,0,0,0.75)',
});

const closedLine = new Feature({
  geometry: new LineString([
    [90, -80],
    [20, -80],
    [20, -20],
    [50, 50],
    [10, 55],
    [60, 80],
    [90, 80],
    [90, -80],
  ]),
  lineColor: 'rgba(255,243,177,0.75)',
});

const dataDriven = {
  'stroke-color': ['get', 'lineColor'],
  'stroke-width': 4,
};
const bevelJoins = {
  'stroke-color': 'rgb(255,64,64)',
  'stroke-width': 12,
  'stroke-line-join': 'bevel',
  'stroke-line-cap': 'square',
};
const miterJoins = {
  'stroke-color': 'rgb(60,222,4)',
  'stroke-offset': 10,
  'stroke-width': 4,
  'stroke-line-join': 'miter',
  'stroke-line-cap': 'butt',
};
const dashed = {
  'stroke-color': 'rgb(0,104,218)',
  'stroke-offset': -10,
  'stroke-width': 4,
  'stroke-line-dash': [18, 10, 10, 10],
  'stroke-line-dash-offset': 10,
};
const style = [bevelJoins, dataDriven, miterJoins, dashed];

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style,
    });
  }
}

const vector = new WebGLLayer({
  source: new VectorSource({
    features: [openLine, closedLine],
  }),
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    zoom: 1,
  }),
});

render({
  message: 'renders to lines side-by-side, one closed and one open',
});
