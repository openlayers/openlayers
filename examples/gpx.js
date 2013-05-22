goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GPX');
goog.require('ol.projection');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.TileLayer({
  source: new ol.source.OSM()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    projection: ol.projection.get('EPSG:4326')
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [-7916461.9312699, 5226343.9091441],
    zoom: 11
  })
});

map.on(['click', 'mousemove'], function(evt) {
  map.getFeatureInfo({
    pixel: evt.getPixel(),
    layers: [vector],
    success: function(features) {
      var info = [];
      for (var i = 0, ii = features.length; i < ii; ++i) {
        info.push(features[i].get('name') + ': ' + features[i].get('type'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '&nbsp;';
    }
  });
});

var gpx = new ol.parser.GPX();

var url = 'data/gpx/yahoo.xml';
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    // this is silly to have to tell the layer the destination projection
    var projection = map.getView().getProjection();
    vector.parseFeatures(xhr.responseText, gpx, projection);
  }
};
xhr.send();
