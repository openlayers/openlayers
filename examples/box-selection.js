goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.DragBox');
goog.require('ol.interaction.Select');
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

// a normal select interaction to handle click
var select = new ol.interaction.Select();
map.addInteraction(select);

var selectedFeatures = select.getFeatures();

// a DragBox interaction used to select features by drawing boxes
var dragBox = new ol.interaction.DragBox({
  condition: ol.events.condition.platformModifierKeyOnly
});

map.addInteraction(dragBox);

dragBox.on('boxend', function() {
  // features that intersect the box are added to the collection of
  // selected features
  var extent = dragBox.getGeometry().getExtent();
  vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
    selectedFeatures.push(feature);
  });
});

// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function() {
  selectedFeatures.clear();
});

var infoBox = document.getElementById('info');

selectedFeatures.on(['add', 'remove'], function() {
  var names = selectedFeatures.getArray().map(function(feature) {
    return feature.get('name');
  });
  if (names.length > 0) {
    infoBox.innerHTML = names.join(', ');
  } else {
    infoBox.innerHTML = 'No countries selected';
  }
});
