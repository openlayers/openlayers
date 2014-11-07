goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


var iconInfo = [{
  offset: [0, 0],
  opacity: 1.0,
  rotateWithView: true,
  rotation: 0.0,
  scale: 1.0,
  size: [55, 55]
}, {
  offset: [110, 86],
  opacity: 0.75,
  rotateWithView: false,
  rotation: Math.PI / 2.0,
  scale: 1.25,
  size: [55, 55]
}, {
  offset: [55, 0],
  opacity: 0.5,
  rotateWithView: true,
  rotation: Math.PI / 3.0,
  scale: 1.5,
  size: [55, 86]
}];

var i;

var iconCount = iconInfo.length;
var icons = new Array(iconCount);
for (i = 0; i < iconCount; ++i) {
  var info = iconInfo[i];
  icons[i] = new ol.style.Icon({
    offset: info.offset,
    opacity: info.opacity,
    rotateWithView: info.rotateWithView,
    rotation: info.rotation,
    scale: info.scale,
    size: info.size,
    src: 'data/Butterfly.png'
  });
}

var featureCount = 30000;
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

// Use the "webgl" renderer by default.
var renderer = exampleNS.getRendererFromQueryString();
if (!renderer) {
  renderer = 'webgl';
}

var map = new ol.Map({
  renderer: renderer,
  layers: [vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 5
  })
});
