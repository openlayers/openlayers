goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.interaction');
goog.require('ol.interaction.DragBox');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.OSM');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var vectorSource = new ol.source.GeoJSON({
  projection: 'EPSG:3857',
  url: 'data/geojson/countries.geojson'
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

// a normal select interaction to handle click
var select = new ol.interaction.Select();
map.addInteraction(select);

var selectedFeatures = select.getFeatures();

// a DragBox interaction used to select features by drawing boxes
var dragBox = new ol.interaction.DragBox({
  condition: ol.events.condition.shiftKeyOnly,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [0, 0, 255, 1]
    })
  })
});

map.addInteraction(dragBox);

var infoBox = document.getElementById('info');

dragBox.on('boxend', function(e) {
  // features that intersect the box are added to the collection of
  // selected features, and their names are displayed in the "info"
  // div
  var info = [];
  var extent = dragBox.getGeometry().getExtent();
  vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
    selectedFeatures.push(feature);
    info.push(feature.get('name'));
  });
  if (info.length > 0) {
    infoBox.innerHTML = info.join(', ');
  }
});

// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function(e) {
  selectedFeatures.clear();
  infoBox.innerHTML = '&nbsp;';
});
map.on('click', function() {
  selectedFeatures.clear();
  infoBox.innerHTML = '&nbsp;';
});
