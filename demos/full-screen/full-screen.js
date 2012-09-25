goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.RendererHint');
goog.require('ol.createMap');
goog.require('ol.layer.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}

var rendererHint = [ol.RendererHint.WEBGL, ol.RendererHint.DOM];
var map = ol.createMap(document.getElementById('map'), {}, rendererHint);
var layer = new ol.layer.MapQuestOpenAerial();
map.getLayers().push(layer);
map.setCenter(new ol.Coordinate(0, 0));
map.setResolution(layer.getStore().getResolutions()[0]);
