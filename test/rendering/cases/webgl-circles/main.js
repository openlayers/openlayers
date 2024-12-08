import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const blueCircle = {
  'circle-radius': 20,
  'circle-fill-color': 'rgba(255,255,255,0.4)',
  'circle-stroke-width': 4,
  'circle-stroke-color': '#3399CC',
  'circle-displacement': [-40, 0],
};
const dataDriven = {
  'circle-radius': 14,
  'circle-fill-color': ['get', 'color'],
  'circle-stroke-width': 2,
  'circle-stroke-color': ['*', ['get', 'color'], '#bbb'],
  'circle-displacement': [40, 0],
};
const scaledRotated = {
  'circle-radius': 12,
  'circle-scale': [4, 0.5],
  'circle-fill-color': 'rgba(255,255,255,0.4)',
  'circle-stroke-width': 2,
  'circle-stroke-color': '#3399CC',
  'circle-rotation': Math.PI / 8,
  'circle-displacement': [0, 40],
};
const scaledRotateWithView = {
  'circle-radius': 6,
  'circle-scale': [2, 3],
  'circle-fill-color': 'rgb(255,0,45)',
  'circle-opacity': 0.5,
  'circle-displacement': [0, -40],
  'circle-rotate-with-view': true,
};
const style = [blueCircle, dataDriven, scaledRotated, scaledRotateWithView];

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
  message: 'Four different circles are rendered around the center of the map',
});
