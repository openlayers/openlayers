goog.require('ol.RendererHint');
goog.require('ol.createMap');
goog.require('ol.layer.MapQuestOpenAerial');


var rendererHint = [ol.RendererHint.WEBGL, ol.RendererHint.DOM];
var map = ol.createMap(document.getElementById('map'), {}, rendererHint);
var layer = new ol.layer.MapQuestOpenAerial();
map.getLayers().push(layer);
map.setCenter(new ol.Coordinate(0, 0));
map.setResolution(layer.getStore().getResolutions()[0]);
