goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');



// Polygons
var vectorPolygons = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/polygon-samples.geojson'
  }),
  style: function(feature, resolution) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.1)'
      }),
      text: new ol.style.Text({
        font: '12px Arial',
        text: feature.getProperties().name,
        fill: new ol.style.Fill({color: 'blue'}),
        stroke: new ol.style.Stroke({color: 'white', width: 3})
      })
    });
    return [style];
  }
});

// Lines
var vectorLines = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/line-samples.geojson'
  }),
  style: function(feature, resolution) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'green',
        width: 2
      }),
      text: new ol.style.Text({
        font: '12px Arial',
        text: feature.getProperties().name,
        fill: new ol.style.Fill({color: 'green'}),
        stroke: new ol.style.Stroke({color: 'white', width: 3})
      })
    });
    return [style];
  }
});

// Points
var vectorPoints = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    projection: 'EPSG:3857',
    url: 'data/geojson/point-samples.geojson'
  }),
  style: function(feature, resolution) {
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new ol.style.Stroke({color: 'red', width: 1})
      }),
      text: new ol.style.Text({
        font: '12px Arial',
        text: feature.getProperties().name,
        fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 1)'}),
        stroke: new ol.style.Stroke({color: 'white', width: 3})
      })
    });
    return [style];
  }
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'osm'})
    }),
    vectorPolygons,
    vectorLines,
    vectorPoints
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [-8161939, 6095025],
    zoom: 8
  })
});
