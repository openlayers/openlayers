import WebGLVectorLayer from 'ol/layer/WebGLVector.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const vectorSource = new VectorSource();

const nicePath = [
  20, 33, 40, 31, 60, 30, 80, 31, 100, 33, 120, 37, 140, 39, 160, 40, 180, 39,
  200, 37, 220, 33, 240, 31, 260, 30, 280, 31, 300, 33,
];

const lineString1 = new LineString(nicePath, 'XY');
vectorSource.addFeature(new Feature({geometry: lineString1, styleId: 1}));

const lineString2 = lineString1.clone();
lineString2.translate(0, 20);
vectorSource.addFeature(new Feature({geometry: lineString2, styleId: 2}));

const lineString3 = lineString2.clone();
lineString3.translate(0, 30);
vectorSource.addFeature(new Feature({geometry: lineString3, styleId: 3}));

const lineString4 = lineString3.clone();
lineString4.translate(0, 30);
vectorSource.addFeature(new Feature({geometry: lineString4, styleId: 4}));

const lineString5 = lineString4.clone();
lineString5.translate(0, 20);
vectorSource.addFeature(new Feature({geometry: lineString5, styleId: 5}));

const lineString6 = lineString5.clone();
lineString6.translate(0, 20);
vectorSource.addFeature(new Feature({geometry: lineString6, styleId: 6}));

const lineString7 = lineString6.clone();
lineString7.translate(0, 30);
vectorSource.addFeature(new Feature({geometry: lineString7, styleId: 7}));

const lineString8 = lineString7.clone();
lineString8.translate(0, 40);
lineString8.scale(-1, -1);
vectorSource.addFeature(new Feature({geometry: lineString8, styleId: 8}));

const lineString9 = lineString8.clone();
vectorSource.addFeature(new Feature({geometry: lineString9, styleId: 9}));

const map = new Map({
  pixelRatio: 1,
  layers: [
    new WebGLVectorLayer({
      source: vectorSource,
      style: [
        {
          filter: ['==', ['get', 'styleId'], 1],
          style: {
            'stroke-color': 'blue',
            'text-value': 'Hello world',
            'text-font': '10px Ubuntu',
            'text-placement': 'line',
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 2],
          style: {
            'stroke-color': 'blue',
            'text-value': 'Scale 2',
            'text-font': 'normal 400 12px/1 Ubuntu',
            'text-scale': 2,
            'text-baseline': 'bottom',
            'text-align': 'right',
            'text-placement': 'line',
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 3],
          style: {
            'stroke-color': 'blue',
            'text-value': 'Set properties',
            'text-font': 'italic bold 0.75em Ubuntu',
            'text-align': 'left',
            'text-offset-x': 10,
            'text-offset-y': -10,
            'text-placement': 'line',
            'text-scale': 1.1,
            'text-stroke-color': '#00F7F8',
            'text-fill-color': '#006772',
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 4],
          style: {
            'stroke-color': 'blue',
            'text-value': 'negative offsetX',
            'text-font': 'normal 400 10px/1 Ubuntu',
            'text-offset-x': -10,
            'text-align': 'end',
            'text-baseline': 'top',
            'text-placement': 'line',
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 5],
          style: {
            'stroke-color': 'blue',
            'text-value': 'Small text',
            'text-font': '10px Ubuntu',
            'text-offset-y': 5,
            'text-scale': 0.7,
            'text-align': 'start',
            'text-placement': 'line',
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 6],
          style: {
            'stroke-color': 'blue',
            'text-value': 'FILL AND STROKE',
            'text-font': '10px Ubuntu',
            'text-placement': 'line',
            'text-fill-color': '#FFC0CB',
            'text-stroke-color': '#00FF00',
            'text-stroke-width': 1,
            'text-align': 'center', // TODO: this should not be necessary
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 7],
          style: {
            'stroke-color': 'blue',
            'text-value': 'Reflection',
            'text-font': 'normal 400 12px/1 Ubuntu',
            'text-scale': [2, -1],
            'text-baseline': 'bottom',
            'text-align': 'right',
            'text-placement': 'line',
            'text-stroke-color': '#FFFF00',
            'text-stroke-width': 1,
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 8],
          style: {
            'stroke-color': 'blue',
            'text-value': 'do not keep upright',
            'text-font': 'normal 400 12px/1 Ubuntu',
            'text-baseline': 'bottom',
            'text-keep-upright': false,
            'text-placement': 'line',
            'text-stroke-color': '#0000FF',
            'text-stroke-width': 1,
            'text-align': 'center', // TODO: this should not be necessary
          },
        },
        {
          filter: ['==', ['get', 'styleId'], 9],
          style: {
            'stroke-color': 'blue',
            'text-value': 'keep upright',
            'text-font': 'normal 400 12px/1 Ubuntu',
            'text-baseline': 'bottom',
            'text-keep-upright': true,
            'text-placement': 'line',
            'text-stroke-color': '#0000FF',
            'text-stroke-width': 1,
            'text-align': 'center', // TODO: this should not be necessary
          },
        },
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    rotation: Math.PI / 4,
  }),
});
map.getView().fit(vectorSource.getExtent());

render({
  message: 'Several lines rendered with labels across them',
  tolerance: 0.01,
});
