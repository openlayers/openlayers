goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.expr');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Polygon');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


var raster = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

// TODO: discuss scale dependent rules
ol.expr.register('resolution', function() {
  return map.getView().getView2D().getResolution();
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GeoJSON(),
    url: 'data/countries.geojson'
  }),
  style: new ol.style.Style({rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Polygon({
          strokeColor: '#319FD3',
          strokeOpacity: 1,
          fillColor: '#ffffff',
          fillOpacity: 0.6
        })
      ]
    }),
    new ol.style.Rule({
      filter: 'resolution() < 5000',
      symbolizers: [
        new ol.style.Text({
          color: '#000000',
          text: ol.expr.parse('name'),
          fontFamily: 'Calibri,sans-serif',
          fontSize: 12
        })
      ]
    })
  ]}),
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
    center: [0, 0],
    zoom: 1
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
