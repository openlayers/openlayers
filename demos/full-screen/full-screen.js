goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.MapOptions'); // FIXME this should not be required
goog.require('ol.control.Zoom');
goog.require('ol.layer.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layer = new ol.layer.MapQuestOpenAerial();
var map = new ol.Map(document.getElementById('map'), {
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  zoom: 0
});
var zoom = new ol.control.Zoom(map, layer.getSource().getResolutions());
