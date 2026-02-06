import LineString from '../src/ol/geom/LineString.js';
import Point from '../src/ol/geom/Point.js';
import Polygon from '../src/ol/geom/Polygon.js';
import {toContext} from '../src/ol/render.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const canvas = document.getElementById('canvas');
const vectorContext = toContext(canvas.getContext('2d'), {size: [100, 100]});

const fill = new Fill({color: 'blue'});
const stroke = new Stroke({color: 'black'});
const style = new Style({
  fill: fill,
  stroke: stroke,
  image: new CircleStyle({
    radius: 10,
    fill: fill,
    stroke: stroke,
  }),
});
vectorContext.setStyle(style);

vectorContext.drawGeometry(
  new LineString([
    [10, 10],
    [90, 90],
  ]),
);
vectorContext.drawGeometry(
  new Polygon([
    [
      [2, 2],
      [98, 2],
      [2, 98],
      [2, 2],
    ],
  ]),
);
vectorContext.drawGeometry(new Point([88, 88]));
