goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.TiledWMS');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layers = new ol.Collection([
  new ol.layer.TileLayer({
    source: new ol.source.MapQuestOpenAerial()
  }),
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://demo.opengeo.org/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true}
    })
  })
]);
var map = new ol.Map({
  center: new ol.Coordinate(-10997148, 4569099),
  layers: layers,
  target: 'map',
  zoom: 4
});
