import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_Feature_ from '../src/ol/feature';
import _ol_geom_LineString_ from '../src/ol/geom/linestring';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Stroke_ from '../src/ol/style/stroke';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var style = new _ol_style_Style_({
  stroke: new _ol_style_Stroke_({
    color: 'black',
    width: 1
  })
});

var feature = new _ol_Feature_(new _ol_geom_LineString_([[-4000000, 0], [4000000, 0]]));

var vector = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    features: [feature]
  }),
  style: style
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var hitTolerance;

var statusElement = document.getElementById('status');

map.on('singleclick', function(e) {
  var hit = false;
  map.forEachFeatureAtPixel(e.pixel, function() {
    hit = true;
  }, {
    hitTolerance: hitTolerance
  });
  if (hit) {
    style.getStroke().setColor('green');
    statusElement.innerHTML = '&nbsp;A feature got hit!';
  } else {
    style.getStroke().setColor('black');
    statusElement.innerHTML = '&nbsp;No feature got hit.';
  }
  feature.changed();
});

var selectHitToleranceElement = document.getElementById('hitTolerance');
var circleCanvas = document.getElementById('circle');

var changeHitTolerance = function() {
  hitTolerance = parseInt(selectHitToleranceElement.value, 10);

  var size = 2 * hitTolerance + 2;
  circleCanvas.width = size;
  circleCanvas.height = size;
  var ctx = circleCanvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(hitTolerance + 1, hitTolerance + 1, hitTolerance + 0.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

selectHitToleranceElement.onchange = changeHitTolerance;
changeHitTolerance();
