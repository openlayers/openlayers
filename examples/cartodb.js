goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.CartoDB');
goog.require('ol.source.OSM');

var mapConfig = {
  'layers': [{
    'type': 'cartodb',
    'options': {
      'cartocss_version': '2.1.1',
      'cartocss': '#layer { polygon-fill: #F00; }',
      'sql': 'select * from european_countries_e where area > 0'
    }
  }]
};

var cartoDBSource = new ol.source.CartoDB({
  account: 'documentation',
  config: mapConfig
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Tile({
      source: cartoDBSource
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

function setArea(n) {
  mapConfig.layers[0].options.sql =
      'select * from european_countries_e where area > ' + n;
  cartoDBSource.setConfig(mapConfig);
}


document.getElementById('country-area').addEventListener('change', function() {
  setArea(this.value);
});
