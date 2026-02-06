import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 32;
canvas.height = 32;
context.strokeStyle = '#0000FF';
context.lineWidth = 16;
context.beginPath();
context.moveTo(0, canvas.height / 2);
context.lineTo(canvas.width, canvas.height / 2);
context.stroke();
const pattern = context.createPattern(canvas, 'repeat');

const box = new Polygon([
  [
    [-64, -64],
    [64, -64],
    [64, 64],
    [-64, 64],
    [-64, -64],
  ],
]);

const polygonStyle = new Style({
  stroke: new Stroke({
    width: 1,
    color: '#000000',
  }),
  fill: new Fill({
    color: pattern,
  }),
});

new Map({
  pixelRatio: 1,
  target: 'map',
  view: new View({
    resolution: 1,
    center: [0, 0],
    zoom: 1,
    rotation: Math.PI / 4,
  }),
  layers: [
    new VectorLayer({
      source: new VectorSource({
        features: [new Feature({geometry: box})],
      }),
      style: polygonStyle,
    }),
  ],
});

render({
  message: 'renders rotated view of square with horizontal striped pattern',
});
