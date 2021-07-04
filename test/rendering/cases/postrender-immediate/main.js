import {Circle, Stroke, Style} from '../../../../src/ol/style.js';
import {Map, View} from '../../../../src/ol/index.js';
import {Point} from '../../../../src/ol/geom.js';
import {Tile as TileLayer} from '../../../../src/ol/layer.js';
import {XYZ} from '../../../../src/ol/source.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import {useGeographic} from '../../../../src/ol/proj.js';

useGeographic();

const center = [8.6, 50.1];
const point = new Point(center);
const style = new Style({
  image: new Circle({
    radius: 40,
    stroke: new Stroke({
      width: 5,
      color: 'red',
    }),
  }),
});

const tileLayer = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

new Map({
  layers: [tileLayer],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
  pixelRatio: 2,
});
tileLayer.on('postrender', function (evt) {
  const vectorContext = getVectorContext(evt);
  vectorContext.setStyle(style);
  vectorContext.drawGeometry(point);
});

render();
