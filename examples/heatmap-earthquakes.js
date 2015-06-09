goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.KML');
goog.require('ol.layer.Heatmap');
goog.require('ol.layer.Tile');
goog.require('ol.source.Stamen');
goog.require('ol.source.Vector');

var blur = document.getElementById('blur');
var radius = document.getElementById('radius');

var vector = new ol.layer.Heatmap({
  source: new ol.source.Vector({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new ol.format.KML({
      extractStyles: false
    })
  }),
  blur: parseInt(blur.value, 10),
  radius: parseInt(radius.value, 10)
});

vector.getSource().on('addfeature', function(event) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var name = event.feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  event.feature.set('weight', magnitude - 5);
});

var raster = new ol.layer.Tile({
  source: new ol.source.Stamen({
    layer: 'toner'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


blur.addEventListener('input', function() {
  vector.setBlur(parseInt(blur.value, 10));
});

radius.addEventListener('input', function() {
  vector.setRadius(parseInt(radius.value, 10));
});
