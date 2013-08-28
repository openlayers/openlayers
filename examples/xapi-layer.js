goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.expr');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.OSM');
goog.require('ol.source.Vector');
goog.require('ol.source.XAPI');


var raster = new ol.layer.TileLayer({
  source: new ol.source.OSM()
});

var vector = new ol.layer.Vector({
  source: new ol.source.XAPI({
    projection: 'EPSG:4326',
    parser: new ol.parser.OSM(),
    url: 'data/osm.xml?'
  }),
  transformFeatureInfo: function(features) {
    return features.length > 0 ?
        features[0].getFeatureId() + ': ' + features[0].get('name') : '&nbsp;';
  }
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [1603037.3571967226, 6460457.630663097],
    zoom: 12
  })
});

map.on(['click', 'mousemove'], function(evt) {
  map.getFeatureInfo({
    pixel: evt.getPixel(),
    layers: [vector],
    success: function(featureInfo) {
      document.getElementById('info').innerHTML = featureInfo[0];
    }
  });
});
