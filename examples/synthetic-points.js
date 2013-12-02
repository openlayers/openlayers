goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.shape');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


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
  '10': [new ol.style.Style({
    image: ol.shape.renderCircle(5,
        new ol.style.Fill({color: '#666666'}),
        new ol.style.Stroke({color: '#bada55', width: 1}))
  })],
  '20': [new ol.style.Style({
    image: ol.shape.renderCircle(10,
        new ol.style.Fill({color: '#666666'}),
        new ol.style.Stroke({color: '#bada55', width: 1}))
  })]
};

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: features
  }),
  styleFunction: function(feature, resolution) {
    return styles[feature.get('size')];
  }
});

var popup = new ol.Overlay({
  element: document.getElementById('popup')
});

var map = new ol.Map({
  layers: [vector],
  renderer: ol.RendererHint.CANVAS,
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  }),
  overlays: [popup]
});

$(map.getViewport()).on('mousemove', function(e) {
  var pixel = map.getEventPixel(e.originalEvent);

  var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    return true;
  });

  if (hit) {
    map.getTarget().style.cursor = 'pointer';
  } else {
    map.getTarget().style.cursor = '';
  }
});
