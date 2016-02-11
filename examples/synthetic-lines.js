goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var count = 10000;
var features = new Array(count);

var startPoint = [0, 0];
var endPoint;

var delta, deltaX, deltaY;
var signX = 1;
var signY = -1;

// Create a square spiral.
var i;
for (i = 0; i < count; ++i) {
  delta = (i + 1) * 2500;
  if (i % 2 === 0) {
    signY *= -1;
  } else {
    signX *= -1;
  }
  deltaX = delta * signX;
  deltaY = delta * signY;
  endPoint = [startPoint[0] + deltaX, startPoint[1] + deltaY];
  features[i] = new ol.Feature({
    'geometry': new ol.geom.LineString([startPoint, endPoint])
  });
  startPoint = endPoint;
}

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: features,
    wrapX: false
  }),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#666666',
      width: 1
    })
  })
});

var view = new ol.View({
  center: [0, 0],
  zoom: 0
});

var map = new ol.Map({
  layers: [vector],
  target: 'map',
  view: view
});
