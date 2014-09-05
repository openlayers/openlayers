goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Heatmap');
goog.require('ol.layer.Tile');
goog.require('ol.source.KML');
goog.require('ol.source.Stamen');


var vector = new ol.layer.Heatmap({
  source: new ol.source.KML({
    extractStyles: false,
    projection: 'EPSG:3857',
    url: 'data/kml/2012_Earthquakes_Mag5.kml'
  }),
  radius: 5
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
