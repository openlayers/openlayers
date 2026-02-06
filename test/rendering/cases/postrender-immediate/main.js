import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

useGeographic();

const center = [8.6, 50.1];
const point = new Point(center);
const style = new Style({
  image: new RegularShape({
    points: 3,
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
    rotation: Math.PI / 3,
  }),
  pixelRatio: 2,
});
tileLayer.on('postrender', function (evt) {
  const vectorContext = getVectorContext(evt);
  vectorContext.setStyle(style);
  vectorContext.drawGeometry(point);
});

render();
