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


var stroke = new ol.style.Stroke({color: 'black', width: 1});

var styles = {
  'square': new ol.style.Style({
    image: new ol.style.RegularShape({
      fill: new ol.style.Fill({color: 'blue'}),
      stroke: stroke,
      points: 4,
      radius: 80,
      angle: Math.PI / 4
    })
  }),
  'triangle': new ol.style.Style({
    image: new ol.style.RegularShape({
      fill: new ol.style.Fill({color: 'red'}),
      stroke: stroke,
      points: 3,
      radius: 80,
      rotation: Math.PI / 4,
      angle: 0
    })
  }),
  'star': new ol.style.Style({
    image: new ol.style.RegularShape({
      fill: new ol.style.Fill({color: 'green'}),
      stroke: stroke,
      points: 5,
      radius: 80,
      radius2: 4,
      angle: 0
    })
  })
};


function createLayer(coordinates, style, zIndex) {
  var feature = new ol.Feature(new ol.geom.Point(coordinates));
  feature.setStyle(style);

  var source = new ol.source.Vector({
    features: [feature]
  });

  var vectorLayer = new ol.layer.Vector({
    source: source
  });
  vectorLayer.setZIndex(zIndex);

  return vectorLayer;
}

var layer0 = createLayer([40, 40], styles['star'], 0);
var layer1 = createLayer([0, 0], styles['square'], 1);
var layer2 = createLayer([0, 40], styles['triangle'], 0);

var layers = [];
layers.push(layer1);
layers.push(layer2);

var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 18
  })
});

layer0.setMap(map);


function bindInputs(id, layer) {
  var idxInput = document.getElementById('idx' + id);
  idxInput.onchange = function() {
    layer.setZIndex(parseInt(this.value, 10) || 0);
  };
  idxInput.value = String(layer.getZIndex());
}
bindInputs(1, layer1);
bindInputs(2, layer2);
