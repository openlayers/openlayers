goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.interaction');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/countries.geojson'
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

var select = null;  // ref to currently selected interaction

// select interaction working on "singleclick"
var selectSingleClick = new ol.interaction.Select();

// select interaction working on "click"
var selectClick = new ol.interaction.Select({
  condition: ol.events.condition.click
});

// select interaction working on "mousemove"
var selectMouseMove = new ol.interaction.Select({
  condition: ol.events.condition.mouseMove
});

var selectElement = document.getElementById('type');

var changeInteraction = function() {
  if (select !== null) {
    map.removeInteraction(select);
  }
  var value = selectElement.value;
  if (value == 'singleclick') {
    select = selectSingleClick;
  } else if (value == 'click') {
    select = selectClick;
  } else if (value == 'mousemove') {
    select = selectMouseMove;
  } else {
    select = null;
  }
  if (select !== null) {
    map.addInteraction(select);
  }
};


/**
 * onchange callback on the select element.
 */
selectElement.onchange = changeInteraction;
changeInteraction();
