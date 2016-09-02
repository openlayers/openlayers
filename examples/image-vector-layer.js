goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.ImageVector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Image({
      source: new ol.source.ImageVector({
        source: new ol.source.Vector({
          url: 'data/geojson/countries.geojson',
          format: new ol.format.GeoJSON()
        }),
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.6)'
          }),
          stroke: new ol.style.Stroke({
            color: '#319FD3',
            width: 1
          })
        })
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});

var featureOverlay = new ol.layer.Vector({
  source: new ol.source.Vector(),
  map: map,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#f00',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.1)'
    })
  })
});

var highlight;
var displayFeatureInfo = function(pixel) {

  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  var info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
  } else {
    info.innerHTML = '&nbsp;';
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }

};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
