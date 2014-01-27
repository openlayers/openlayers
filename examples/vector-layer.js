goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.FeaturesOverlay');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var styleArray = [new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  })
})];

var vectorLayer = new ol.layer.Vector({
  source: new ol.source.GeoJSON({
    url: 'data/geojson/countries.geojson'
  }),
  styleFunction: function(feature, resolution) {
    return styleArray;
  }
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    }),
    vectorLayer
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

var highlightStyleArray = [new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,0,0,0.1)'
  })
})];

var featuresOverlay = new ol.render.FeaturesOverlay({
  map: map,
  styleFunction: function(feature, resolution) {
    return highlightStyleArray;
  }
});

var highlight;
var displayFeatureInfo = function(pixel) {

  var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
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
      featuresOverlay.removeFeature(highlight);
    }
    if (feature) {
      featuresOverlay.addFeature(feature);
    }
    highlight = feature;
  }

};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  displayFeatureInfo(evt.pixel);
});
