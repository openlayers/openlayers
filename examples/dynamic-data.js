import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_MultiPoint_ from '../src/ol/geom/multipoint';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
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
  vectorContext.drawGeometry(new _ol_geom_MultiPoint_(coordinates));

  var headPoint = new _ol_geom_Point_(coordinates[coordinates.length - 1]);

  vectorContext.setStyle(headOuterImageStyle);
  vectorContext.drawGeometry(headPoint);

  vectorContext.setStyle(headInnerImageStyle);
  vectorContext.drawGeometry(headPoint);

  map.render();
});
map.render();
