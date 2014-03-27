goog.require('ol.Collection');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.events.condition');
goog.require('ol.interaction');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  style: 'Aerial',
  source: new ol.source.MapQuest({
    layer: 'sat'
  })
});

var source = new ol.source.GeoJSON({
  projection: 'EPSG:3857',
  url: 'data/geojson/countries.geojson'
});

var vector = new ol.layer.Vector({
  source: source
});

var select = new ol.interaction.Select({
  addCondition: ol.events.condition.shiftKeyOnly,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#3399CC',
      width: 2.5
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.6)'
    })
  })
});

var modify = new ol.interaction.Modify({
  features: select.getFeatures()
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, modify]),
  layers: [raster, vector],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
