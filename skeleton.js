goog.require('goog.object');
goog.require('ol.Coordinate');
goog.require('ol.RendererHint');
goog.require('ol.createMap');
goog.require('ol.tilelayer.createOpenStreetMap');

var twoMaps = true;

var target;
var map, map1, map2;
var layer;

target = /** @type {!HTMLDivElement} */ document.getElementById('map1');
map = map1 = ol.createMap(target, undefined, ol.RendererHint.DOM);
layer = ol.tilelayer.createOpenStreetMap({
  'opacity': 0.9
});
map.getLayers().push(layer);

var resolutions = layer.getStore().getResolutions();
map1.setCenter(new ol.Coordinate(0, 0));
map1.setResolution(resolutions[0]);

if (twoMaps) {
  target = /** @type {!HTMLDivElement} */ document.getElementById('map2');
  map2 = ol.createMap(target, undefined, ol.RendererHint.DOM);
  map2.bindTo('center', map1);
  map2.bindTo('layers', map1);
  map2.bindTo('resolution', map1);
}

goog.exportSymbol('layer', layer);
goog.exportSymbol('map', map);
goog.exportSymbol('map1', map1);
goog.exportSymbol('map2', map2);
