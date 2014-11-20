goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var symbolInfo = [{
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(255, 153, 0, 0.4)',
  strokeColor: 'rgba(255, 204, 0, 0.2)'
}, {
  opacity: 0.75,
  scale: 1.25,
  fillColor: 'rgba(70, 80, 224, 0.4)',
  strokeColor: 'rgba(12, 21, 138, 0.2)'
}, {
  opacity: 0.5,
  scale: 1.5,
  fillColor: 'rgba(66, 150, 79, 0.4)',
  strokeColor: 'rgba(20, 99, 32, 0.2)'
}, {
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(176, 61, 35, 0.4)',
  strokeColor: 'rgba(145, 43, 20, 0.2)'
}];

var radiuses = [3, 6, 9, 15, 19, 25];
var symbolCount = symbolInfo.length * radiuses.length;
var symbols = [];
var i, j;
for (i = 0; i < symbolInfo.length; ++i) {
  var info = symbolInfo[i];
  for (j = 0; j < radiuses.length; ++j) {
    symbols.push(new ol.style.RegularShape({
      points: 8,
      opacity: info.opacity,
      scale: info.scale,
      radius: radiuses[j],
      radius2: radiuses[j] * 0.7,
      angle: 1.4,
      fill: new ol.style.Fill({
        color: info.fillColor
      }),
      stroke: new ol.style.Stroke({
        color: info.strokeColor,
        width: 1
      })
    }));
  }
}

var featureCount = 5000;
var features = new Array(featureCount);
var feature, geometry;
var e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new ol.geom.Point(
      [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new ol.Feature(geometry);
  feature.setStyle(
      new ol.style.Style({
        image: symbols[i % (symbolCount - 1)]
      })
  );
  features[i] = feature;
}

var vectorSource = new ol.source.Vector({
  features: features
});
var vector = new ol.layer.Vector({
  source: vectorSource
});

var map = new ol.Map({
  layers: [vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 3
  })
});
