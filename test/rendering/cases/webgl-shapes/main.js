import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const blueStar = {
  'shape-points': 5,
  'shape-radius': 20,
  'shape-radius2': 10,
  'shape-fill-color': 'rgba(255,255,255,0.4)',
  'shape-stroke-width': 4,
  'shape-stroke-color': '#3399CC',
  'shape-displacement': [-40, 0],
  'shape-angle': Math.PI / 16,
};
const dataDriven = {
  'shape-points': 4,
  'shape-radius': 14,
  'shape-fill-color': ['get', 'color'],
  'shape-stroke-width': 2,
  'shape-stroke-color': ['*', ['get', 'color'], '#bbb'],
  'shape-displacement': [40, 0],
  'shape-angle': -Math.PI / 16,
};
const scaledRotated = {
  'shape-points': 10,
  'shape-radius': 12,
  'shape-radius2': 9,
  'shape-scale': [4, 0.5],
  'shape-fill-color': 'rgba(255,255,255,0.4)',
  'shape-stroke-width': 2,
  'shape-stroke-color': '#3399CC',
  'shape-rotation': Math.PI / 8,
  'shape-displacement': [0, 40],
};
const scaledRotateWithView = {
  'shape-points': 7,
  'shape-radius': 6,
  'shape-scale': [2, 3],
  'shape-fill-color': 'rgb(255,0,45)',
  'shape-opacity': 0.5,
  'shape-displacement': [0, -40],
  'shape-rotate-with-view': true,
};
const style = [blueStar, dataDriven, scaledRotated, scaledRotateWithView];

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
  message: 'Four different shapes are rendered around the center of the map',
});
