goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var style = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'black',
    width: 1
  })
});

var feature = new ol.Feature(new ol.geom.LineString([[-4000000, 0], [4000000, 0]]));

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [feature]
  }),
  style: style
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
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
