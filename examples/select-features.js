goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.interaction');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/countries.geojson'
  })
});

var styleCache = {};
var select = new ol.interaction.Select({
  style: function(feature, resolution) {
    var text = feature.get('name');
    if (!styleCache[text]) {
      styleCache[text] = [new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255,0,0,0.3)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255,0,0,1)',
          size: 2
        }),
        text: new ol.style.Text({
          font: '12px Calibri,sans-serif',
          text: text,
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          })
        })
      })];
    }
    return styleCache[text];
  }
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select]),
  layers: [raster, vector],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
