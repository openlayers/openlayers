goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.shape');
goog.require('ol.source.Vector');


var count = 20000;
var features = new Array(count);
var e = 18000000;
for (var i = 0; i < count; ++i) {
  features[i] = new ol.Feature({
    'geometry': new ol.geom.Point(
        [2 * e * Math.random() - e, 2 * e * Math.random() - e]),
    'i': i,
    'size': i % 2 ? 10 : 20
  });
}

var styles = {
  '10': {
    image: ol.shape.renderCircle(
        5, {color: '#666666'}, {color: '#bada55', width: 1})
  },
  '20': {
    image: ol.shape.renderCircle(
        10, {color: '#666666'}, {color: '#bada55', width: 1})
  }
};

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: features
  }),
  styleFunction: function(feature) {
    return styles[feature.get('size')];
  }
});

var popup = new ol.Overlay({
  element: document.getElementById('popup')
});

var map = new ol.Map({
  layers: [vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  }),
  overlays: [popup]
});
