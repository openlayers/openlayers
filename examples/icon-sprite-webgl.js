goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


var iconInfo = [
  {size: [55, 55], offset: [0, 0]},
  {size: [55, 55], offset: [110, 86]},
  {size: [55, 86], offset: [55, 0]}
];

var i;

var iconCount = iconInfo.length;
var icons = new Array(iconCount);
for (i = 0; i < iconCount; ++i) {
  icons[i] = new ol.style.Icon({
    src: 'data/Butterfly.png',
    size: iconInfo[i].size,
    offset: iconInfo[i].offset
  });
}

var featureCount = 10000;
var features = new Array(featureCount);
var feature, geometry;
var e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new ol.geom.Point(
      [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new ol.Feature(geometry);
  feature.setStyle(
      new ol.style.Style({
        image: icons[i % iconCount]
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
  renderer: 'webgl',
  layers: [vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 5
  })
});
