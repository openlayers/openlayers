goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var vectorSource = new ol.source.Vector();
var styleArray = [new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  })
})];

var vectorLayer;
$.getJSON('data/countries.geojson', function(data) {
  var format = new ol.format.GeoJSON();
  var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
  format.readObject(data, function(feature) {
    var geometry = feature.getGeometry();
    geometry.transform(transformFn);
    feature.setGeometry(geometry);
    vectorSource.addFeature(feature);
  });
  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    styleFunction: function(feature, resolution) {
      return styleArray;
    }
  });
  map.getLayers().push(vectorLayer);
});

var highlight;
var displayFeatureInfo = function(pixel) {
  var oldHighlight = highlight;

  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  var info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
  } else {
    info.innerHTML = '&nbsp;';
  }

  highlight = feature;

  if (highlight !== oldHighlight) {
    map.requestRenderFrame();
  }
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});

var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,0,0,0.1)'
  })
});

map.on('postcompose', function(evt) {
  if (highlight) {
    var render = evt.getRender();
    render.drawFeature(highlight, highlightStyle);
  }
});
