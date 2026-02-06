import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

// generate an icon
const canvas = document.createElement('canvas');
canvas.width = 20;
canvas.height = 20;
const context = canvas.getContext('2d');
context.beginPath();
context.arc(10, 10, 10, 0, 2 * Math.PI, false);
context.fillStyle = 'white';
context.fill();

const iconSimple = {
  'icon-src': '/data/me0.svg',
  'icon-displacement': [-40, 0],
};
const dataDriven = {
  'icon-src': canvas.toDataURL('png'),
  'icon-color': ['get', 'color'],
  'icon-displacement': [40, 0],
};
const scaledRotated = {
  'icon-src': '/data/fish.png',
  'icon-scale': [2, 1],
  'icon-rotation': Math.PI / 8,
  'icon-displacement': [0, 40],
};
const scaledRotateWithView = {
  'icon-src': '/data/cross.svg',
  'icon-scale': [1.2, 1.5],
  'icon-color': 'rgb(255,183,0)',
  'icon-opacity': 0.5,
  'icon-displacement': [0, -40],
  'icon-rotate-with-view': true,
};
const withAnchor = {
  'icon-src': '/data/icon.png',
  'icon-anchor': [0.5, 46],
  'icon-anchor-origin': 'top-right',
  'icon-anchor-x-units': 'fraction',
  'icon-anchor-y-units': 'pixels',
  'icon-scale': 0.5,
};
const spriteSheet = {
  'icon-src': '/data/sprites/gis_symbols.png',
  'icon-color': [255, 0, 0, 1],
  'icon-offset': [32, 0],
  'icon-size': [32, 32],
};
const style = [
  iconSimple,
  dataDriven,
  scaledRotated,
  scaledRotateWithView,
  spriteSheet,
  withAnchor,
];

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features: [
      new Feature({
        geometry: new Point([0, 0]),
        color: '#c256de',
      }),
    ],
  }),
  style,
});

const raster = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/osm/{z}/{x}/{y}.png',
    transition: 0,
  }),
});

new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
    rotation: Math.PI / 8,
  }),
});

render({
  message: 'Six different icons are rendered around the center of the map',
});
