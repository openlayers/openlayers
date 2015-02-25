goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.interaction');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vectorPoints = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/point-samples.geojson'
  })
});

var vectorLines = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/line-samples.geojson'
  })
});

var vectorPolygon = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/polygon-samples.geojson'
  })
});

var map = new ol.Map({
  layers: [raster, vectorPoints, vectorLines, vectorPolygon],
  target: 'map',
  view: new ol.View({
    center: [-8158916.7432516385, 6089191.134975344],
    zoom: 8
  })
});

// element references
var typeElement = document.getElementById('type');
var typesElement = document.getElementById('types');

// Filter geometries
var types;
var changeFilter = function() {
  var type = typeElement.value;
  typesElement.innerHTML = type === 'Any' ? type :
      typesElement.innerHTML === 'Any' ? type :
          typesElement.innerHTML + ',' + type;

  if (typesElement.innerHTML !== 'Any') {
    types = typesElement.innerHTML.split(',');
  } else {
    types = null;
  }

};

// select interaction
var selectInteraction = new ol.interaction.Select({
  filter: function(feature) {
    if (types === null) {
      return true;
    } else {
      return goog.array.contains(types, feature.getGeometry().getType());
    }
  }
});
map.addInteraction(selectInteraction);


/**
 * onchange callback on the type element.
 */
typeElement.onchange = changeFilter;
changeFilter();
