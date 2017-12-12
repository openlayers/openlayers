import _ol_geom_LineString_ from '../src/ol/geom/LineString.js';
import _ol_geom_Point_ from '../src/ol/geom/Point.js';
import _ol_geom_Polygon_ from '../src/ol/geom/Polygon.js';
import _ol_render_ from '../src/ol/render.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var canvas = document.getElementById('canvas');
var vectorContext = _ol_render_.toContext(canvas.getContext('2d'), {size: [100, 100]});

var fill = new _ol_style_Fill_({color: 'blue'});
var stroke = new _ol_style_Stroke_({color: 'black'});
var style = new _ol_style_Style_({
  fill: fill,
  stroke: stroke,
  image: new _ol_style_Circle_({
    radius: 10,
    fill: fill,
    stroke: stroke
  })
});
vectorContext.setStyle(style);

vectorContext.drawGeometry(new _ol_geom_LineString_([[10, 10], [90, 90]]));
vectorContext.drawGeometry(new _ol_geom_Polygon_([[[2, 2], [98, 2], [2, 98], [2, 2]]]));
vectorContext.drawGeometry(new _ol_geom_Point_([88, 88]));
