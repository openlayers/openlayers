import Feature from '../../../../src/ol/Feature.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const nicePath = [
  20, 33, 40, 31, 60, 30, 80, 31, 100, 33, 120, 37, 140, 39, 160, 40, 180, 39,
  200, 37, 220, 33, 240, 31, 260, 30, 280, 31, 300, 33,
];

const lineString1 = new LineString(nicePath, 'XY');
const feature1 = new Feature({geometry: lineString1});
const vectorSource1 = new VectorSource({features: [feature1]});
const style1 = {
  'stroke-color': 'blue',
  'text-value': 'Hello world',
  'text-font': '10px Ubuntu',
  'text-placement': 'line',
};

const lineString2 = lineString1.clone();
lineString2.translate(0, 20);
const feature2 = new Feature({geometry: lineString2});
const vectorSource2 = new VectorSource({features: [feature2]});
const style2 = {
  'stroke-color': 'blue',
  'text-value': 'Scale 2',
  'text-font': 'normal 400 12px/1 Ubuntu',
  'text-scale': 2,
  'text-baseline': 'bottom',
  'text-align': 'right',
  'text-placement': 'line',
};

const lineString3 = lineString2.clone();
lineString3.translate(0, 30);
const feature3 = new Feature({geometry: lineString3});
const vectorSource3 = new VectorSource({features: [feature3]});
const style3 = {
  'stroke-color': 'blue',
  'text-value': 'Small text',
  'text-font': '10px Ubuntu',
  'text-offset-y': 5,
  'text-scale': 0.7,
  'text-align': 'start',
  'text-placement': 'line',
};

const lineString4 = lineString3.clone();
lineString4.translate(0, 20);
const feature4 = new Feature({geometry: lineString4});
const vectorSource4 = new VectorSource({features: [feature4]});
const style4 = {
  'stroke-color': 'blue',
  'text-value': 'FILL AND STROKE',
  'text-font': '10px Ubuntu',
  'text-placement': 'line',
  'text-fill-color': '#FF0000',
  'text-stroke-color': '#00FF00',
  'text-stroke-width': 1,
};

const lineString5 = lineString4.clone();
lineString5.translate(0, 30);
const feature5 = new Feature({geometry: lineString5});
const vectorSource5 = new VectorSource({features: [feature5]});
const style5 = {
  'stroke-color': 'blue',
  'text-value': 'Reflection',
  'text-font': 'normal 400 12px/1 Ubuntu',
  'text-scale': [2, -1],
  'text-baseline': 'bottom',
  'text-align': 'right',
  'text-placement': 'line',
  'text-stroke-color': '#FFFF00',
  'text-stroke-width': 1,
};

const lineString6 = lineString5.clone();
lineString6.translate(0, 40);
lineString6.scale(-1, -1);
const feature6 = new Feature({geometry: lineString6});
const vectorSource6 = new VectorSource({features: [feature6]});
const style6 = {
  'stroke-color': 'blue',
  'text-value': 'do not keep upright',
  'text-font': 'normal 400 12px/1 Ubuntu',
  'text-baseline': 'bottom',
  'text-keep-upright': false,
  'text-placement': 'line',
  'text-stroke-color': 'red',
  'text-stroke-width': 1,
};

const lineString7 = lineString6.clone();
const feature7 = new Feature({geometry: lineString7});
const vectorSource7 = new VectorSource({features: [feature7]});
const style7 = {
  'stroke-color': 'blue',
  'text-value': 'keep upright',
  'text-font': 'normal 400 12px/1 Ubuntu',
  'text-baseline': 'bottom',
  'text-keep-upright': true,
  'text-placement': 'line',
  'text-stroke-color': 'green',
  'text-stroke-width': 1,
};

const map = new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource1,
      style: style1,
    }),
    new VectorLayer({
      source: vectorSource2,
      style: style2,
    }),
    new VectorLayer({
      source: vectorSource3,
      style: style3,
    }),
    new VectorLayer({
      source: vectorSource4,
      style: style4,
    }),
    new VectorLayer({
      source: vectorSource5,
      style: style5,
    }),
    new VectorLayer({
      source: vectorSource6,
      style: style6,
    }),
    new VectorLayer({
      source: vectorSource7,
      style: style7,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: Math.PI / 4,
  }),
});
map.getView().fit([20, 30, 300, 180]);

render({tolerance: 0.01});
