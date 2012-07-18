goog.require('goog.math.Coordinate');
goog.require('goog.object');
goog.require('ol.createMap');
goog.require('ol.tilelayer.createOpenStreetMap');


var target = /** @type {!HTMLDivElement} */ document.getElementById('map');
var map = ol.createMap(target);

var layer = ol.tilelayer.createOpenStreetMap({
  'opacity': 0.5
});
map.getLayers().push(layer);

var resolutions = layer.getStore().getResolutions();
map.setCenter(new goog.math.Coordinate(0, 0));
map.setResolution(resolutions[0]);

goog.exportSymbol('layer', layer);
goog.exportSymbol('map', map);
