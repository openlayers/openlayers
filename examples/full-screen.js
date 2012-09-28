goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.MapOptions'); // FIXME this should not be required
goog.require('ol.overlay.Overlay');
goog.require('ol.source.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map(document.getElementById('map'), {
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  zoom: 2
});
var vienna = new ol.overlay.Overlay({
  map: map,
  coordinate: ol.Projection.transformWithCodes(
      new ol.Coordinate(16, 48), 'EPSG:4326', 'EPSG:3857'),
  element: document.getElementById('vienna')
});
