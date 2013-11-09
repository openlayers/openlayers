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

goog.net.XhrIo.send('data/countries.geojson', function(event) {
  var xhrIo = /** @type {goog.net.XhrIo} */ (event.target);
  if (xhrIo.isSuccess()) {
    var format = new ol.format.GeoJSON();
    var object = xhrIo.getResponseJson();
    var vectorSource = new ol.source.Vector();
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
