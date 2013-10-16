goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GPX');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GPX(),
    url: 'data/gpx/yahoo.xml'
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

var displayFeatureInfo = function(pixel) {
  map.getFeatures({
    pixel: pixel,
    layers: [vector],
    success: function(featuresByLayer) {
      var features = featuresByLayer[0];
      var info = [];
      for (var i = 0, ii = features.length; i < ii; ++i) {
        info.push(features[i].get('name') + ': ' + features[i].get('type'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '&nbsp;';
    }
  });
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});
