// NOCOMPILE
// FIXME don't rely on goog.* functions
goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.net.XhrIo');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');

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

goog.net.XhrIo.send('data/countries.geojson', function(event) {
  var xhrIo = /** @type {goog.net.XhrIo} */ (event.target);
  if (xhrIo.isSuccess()) {
    var format = new ol.format.GeoJSON();
    var object = xhrIo.getResponseJson();
    goog.asserts.assert(goog.isDefAndNotNull(object));
    var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
    format.readObject(object, function(feature) {
      var geometry = feature.getGeometry();
      geometry.transform(transformFn);
      feature.setGeometry(geometry);
      vectorSource.addFeature(feature);
    });
    map.getLayers().push(new ol.layer.Vector({
      source: vectorSource,
      styleFunction: goog.functions.constant({
        fill: {
          color: 'rgba(255, 255, 255, 0.6)'
        },
        stroke: {
          color: '#319FD3'
        }
      })
    }));
  }
});

var displayFeatureInfo = function(pixel) {
  var coordinate = map.getCoordinateFromPixel(pixel);
  var features = vectorSource.getAllFeaturesAtCoordinate(coordinate);
  var innerHTML = features.length ?
      features[0].getId() + ': ' + features[0].get('name') :
      '&nbsp;';
  document.getElementById('info').innerHTML = innerHTML;
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});
