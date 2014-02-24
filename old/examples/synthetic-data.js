goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.expr');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Shape');
goog.require('ol.style.ShapeType');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOpenAerial()
});

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

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    projection: ol.proj.get('EPSG:3857'),
    parser: new ol.parser.GeoJSON(),
    data: {
      type: 'FeatureCollection',
      features: features
    }
  }),
  style: new ol.style.Style({rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Shape({
          type: ol.style.ShapeType.CIRCLE,
          size: ol.expr.parse('size'),
          stroke: new ol.style.Stroke({color: '#666666'}),
          fill: new ol.style.Fill({color: '#bada55'})
        })
      ]
    })
  ]})
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
