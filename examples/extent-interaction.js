goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.Extent');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var vectorSource = new ol.source.Vector({
  url: 'data/geojson/countries.geojson',
  format: new ol.format.GeoJSON()
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Vector({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var extent = new ol.interaction.Extent({
  condition: ol.events.condition.platformModifierKeyOnly
});
map.addInteraction(extent);
extent.setActive(false);

//Enable interaction by holding shift
this.addEventListener('keydown', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(true);
  }
});
this.addEventListener('keyup', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(false);
  }
});
