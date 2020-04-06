import {Circle as CircleStyle, Fill, Stroke, Style} from '../src/ol/style.js';
import {LineString, Point, Polygon} from '../src/ol/geom.js';
import {toContext} from '../src/ol/render.js';

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
  ])
);
vectorContext.drawGeometry(
  new Polygon([
    [
      [2, 2],
      [98, 2],
      [2, 98],
      [2, 2],
    ],
  ])
);
vectorContext.drawGeometry(new Point([88, 88]));
