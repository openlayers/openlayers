import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import Feature from '../src/ol/Feature.js';
import LineString from '../src/ol/geom/LineString.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';

var raster = new TileLayer({
  source: new _ol_source_OSM_()
});

var style = new _ol_style_Style_({
  stroke: new _ol_style_Stroke_({
    color: 'black',
    width: 1
  })
});

var feature = new Feature(new LineString([[-4000000, 0], [4000000, 0]]));

var vector = new VectorLayer({
  source: new _ol_source_Vector_({
    features: [feature]
  }),
  style: style
});

var map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
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
