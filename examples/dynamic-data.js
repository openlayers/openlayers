import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var map = new _ol_Map_({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var imageStyle = new _ol_style_Style_({
  image: new _ol_style_Circle_({
    radius: 5,
    snapToPixel: false,
    fill: new _ol_style_Fill_({color: 'yellow'}),
    stroke: new _ol_style_Stroke_({color: 'red', width: 1})
  })
});

var headInnerImageStyle = new _ol_style_Style_({
  image: new _ol_style_Circle_({
    radius: 2,
    snapToPixel: false,
    fill: new _ol_style_Fill_({color: 'blue'})
  })
});

var headOuterImageStyle = new _ol_style_Style_({
  image: new _ol_style_Circle_({
    radius: 5,
    snapToPixel: false,
    fill: new _ol_style_Fill_({color: 'black'})
  })
});

var n = 200;
var omegaTheta = 30000; // Rotation period in ms
var R = 7e6;
var r = 2e6;
var p = 2e6;
map.on('postcompose', function(event) {
  var vectorContext = event.vectorContext;
  var frameState = event.frameState;
  var theta = 2 * Math.PI * frameState.time / omegaTheta;
  var coordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    var t = theta + 2 * Math.PI * i / n;
    var x = (R + r) * Math.cos(t) + p * Math.cos((R + r) * t / r);
    var y = (R + r) * Math.sin(t) + p * Math.sin((R + r) * t / r);
    coordinates.push([x, y]);
  }
  vectorContext.setStyle(imageStyle);
  vectorContext.drawGeometry(new MultiPoint(coordinates));

  var headPoint = new Point(coordinates[coordinates.length - 1]);

  vectorContext.setStyle(headOuterImageStyle);
  vectorContext.drawGeometry(headPoint);

  vectorContext.setStyle(headInnerImageStyle);
  vectorContext.drawGeometry(headPoint);

  map.render();
});
map.render();
