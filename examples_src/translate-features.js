goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.interaction');
goog.require('ol.interaction.Select');
goog.require('ol.interaction.Translate');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.MapQuest');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/geojson/countries.geojson',
    format: new ol.format.GeoJSON()
  })
});

var pointFeature = new ol.Feature(new ol.geom.Point([0, 0]));

var lineFeature = new ol.Feature(
    new ol.geom.LineString([[-1e7, 1e6], [-1e6, 3e6]]));

var vector2 = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [pointFeature, lineFeature]
  }),
  style: new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.95,
      src: 'data/icon.png'
    })),
    stroke: new ol.style.Stroke({
      width: 3,
      color: [255, 0, 0, 1]
    }),
    fill: new ol.style.Fill({
      color: [0, 0, 255, 0.6]
    })
  })
});

var select = new ol.interaction.Select();

var translate = new ol.interaction.Translate({
  features: select.getFeatures()
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, translate]),
  layers: [raster, vector, vector2],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
