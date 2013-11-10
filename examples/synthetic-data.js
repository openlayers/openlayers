goog.require('goog.functions');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.symbol');


// build up some GeoJSON features
var count = 20000;
var features = new Array(count);
var e = 18000000;
for (var i = 0; i < count; ++i) {
  features[i] = {
    type: 'Feature',
    properties: {
      i: i,
      size: i % 2 ? 10 : 20
    },
    geometry: {
      type: 'Point',
      coordinates: [
        2 * e * Math.random() - e, 2 * e * Math.random() - e
      ]
    }
  };
}

var vectorSource = new ol.source.Vector();
new ol.format.GeoJSON().readObject({
  type: 'FeatureCollection',
  features: features
}, vectorSource.addFeature, vectorSource);

var styleFunction = goog.functions.constant({
  image: ol.symbol.renderCircle(
      5,
      {
        color: '#666666'
      },
      {
        color: '#bada55',
        width: 1
      })
});


var vector = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: styleFunction
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
