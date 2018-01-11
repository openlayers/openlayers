import LineString from '../src/ol/geom/LineString.js';
import Point from '../src/ol/geom/Point.js';
import Polygon from '../src/ol/geom/Polygon.js';
import _ol_render_ from '../src/ol/render.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';


var canvas = document.getElementById('canvas');
var vectorContext = _ol_render_.toContext(canvas.getContext('2d'), {size: [100, 100]});

var fill = new _ol_style_Fill_({color: 'blue'});
var stroke = new _ol_style_Stroke_({color: 'black'});
var style = new Style({
  fill: fill,
  stroke: stroke,
  image: new _ol_style_Circle_({
    radius: 10,
    fill: fill,
    stroke: stroke
  })
});
vectorContext.setStyle(style);

vectorContext.drawGeometry(new LineString([[10, 10], [90, 90]]));
vectorContext.drawGeometry(new Polygon([[[2, 2], [98, 2], [2, 98], [2, 2]]]));
vectorContext.drawGeometry(new Point([88, 88]));
