goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.SelectBox');
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
  renderer: 'canvas',
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var select = new ol.interaction.SelectBox();
map.addInteraction(select);

var selectedFeatures = select.getFeatures();

var infoBox = document.getElementById('info');

select.on('select', function(e) {
  // selected features names are displayed in the "info" div
  var info = e.selected.map(function(item) {
    return item.get('name');
  });
  if (info.length > 0) {
    infoBox.innerHTML = info.join(', ');
  } else if (selectedFeatures.getLength() === 0) {
    infoBox.innerHTML = '&nbsp;';
  }
});
