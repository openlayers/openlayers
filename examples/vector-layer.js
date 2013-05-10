goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Polygon');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');


var raster = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    projection: ol.projection.get('EPSG:4326')
  }),
  style: new ol.style.Style({rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Polygon({
          strokeColor: '#bada55'
        })
      ]
    })
  ]})
});

var map = new ol.Map({
  layers: new ol.Collection([raster, vector]),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

map.on('mousemove', function(evt) {
  map.getFeatureInfo({
    pixel: evt.getPixel(),
    layers: [vector],
    success: function(features) {
      var info = [];
      for (var i = 0, ii = features.length; i < ii; ++i) {
        info.push(features[i].get('name'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '&nbsp;';
    }
  });
});


var geojson = new ol.parser.GeoJSON();
var url = 'data/countries.json';
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    // this is silly to have to tell the layer the destination projection
    var projection = map.getView().getProjection();
    vector.parseFeatures(xhr.responseText, geojson, projection);
  }
};
xhr.send();
