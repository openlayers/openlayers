import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

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
  firstDashDistance: 18,
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
  firstDashDistance: 18,
});

const lineWithUnusualGeometry = new Feature({
  geometry: new LineString([
    [-70, -110],
    [-70, -110], // first segment has 0-width
    [70, -110],
    [-20, -110], // last segment is colinear with the previous one
  ]),
  lineColor: 'rgba(177,228,255,0.5)',
  firstDashDistance: 18,
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
  'stroke-line-dash': [['get', 'firstDashDistance'], 10, 10, 10],
  'stroke-line-dash-offset': 10,
};
const style = [bevelJoins, dataDriven, miterJoins, dashed];

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features: [openLine, closedLine, lineWithUnusualGeometry],
  }),
  style,
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
  message: 'renders two lines side-by-side, one closed and one open',
});
