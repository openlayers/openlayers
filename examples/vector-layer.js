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
var style = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  })
});

$.getJSON('data/countries.geojson', function(data) {
  var format = new ol.format.GeoJSON();
  var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
  format.readObject(data, function(feature) {
    var geometry = feature.getGeometry();
    geometry.transform(transformFn);
    feature.setGeometry(geometry);
    vectorSource.addFeature(feature);
  });
  map.getLayers().push(new ol.layer.Vector({
    source: vectorSource,
    styleFunction: function(feature) {
      return style;
    }
  }));
});

var highlight;
var displayFeatureInfo = function(pixel) {
  var oldHighlight = highlight;
  var coordinate = map.getCoordinateFromPixel(pixel);
  var features = vectorSource.getAllFeaturesAtCoordinate(coordinate);
  var info = document.getElementById('info');
  if (features.length > 0) {
    var feature = features[0];
    info.innerHTML = feature.getId() + ': ' + features[0].get('name');
    highlight = feature;
  } else {
    info.innerHTML = '&nbsp;';
    highlight = undefined;
  }
  if (highlight !== oldHighlight) {
    map.render();
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

map.on('postcompose', function(evt) {
  if (highlight) {
    var render = evt.getRender();
    render.drawFeature(highlight, {
      stroke: {
        color: '#f00',
        width: 1
      },
      fill: {
        color: 'rgba(255,0,0,0.1)'
      }
    });
  }
});
