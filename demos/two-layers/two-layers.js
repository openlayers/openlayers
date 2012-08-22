goog.require('ol.Coordinate');
goog.require('ol.RendererHint');
goog.require('ol.control.Attribution');
goog.require('ol.createMap');
goog.require('ol.layer.BingMaps');
goog.require('ol.layer.TileJSON');


var layer1 = new ol.layer.BingMaps(
    ol.BingMapsStyle.AERIAL,
    'AheP841R-MsLErKQChaTba_xDoOCl40-EeTubD9uNhNAyQTePwFY9iVD1_pyqqlE');
var layer2 = new ol.layer.TileJSON(
    'http://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.jsonp');

var layers = new ol.Collection([layer1, layer2]);

var webglMap = ol.createMap(
    document.getElementById('webglMap'),
    {'layers': new ol.Collection([layer1, layer2])},
    ol.RendererHint.WEBGL);

goog.events.listen(layer2, goog.events.EventType.LOAD, function() {
  webglMap.setUserCenter(new ol.Coordinate(-77.93254999999999, 37.9555));
  webglMap.setResolution(layer2.getStore().getResolutions()[5]);
});

var domMap = ol.createMap(
    document.getElementById('domMap'),
    {},
    ol.RendererHint.DOM);
domMap.bindTo('center', webglMap);
domMap.bindTo('layers', webglMap);
domMap.bindTo('resolution', webglMap);
domMap.bindTo('rotation', webglMap);

var attributionControl = new ol.control.Attribution(webglMap);
document.getElementById('attribution').appendChild(
    attributionControl.getElement());

goog.exportSymbol('layer1', layer1);
goog.exportSymbol('layer2', layer2);
goog.exportSymbol('layers', layers);
goog.exportSymbol('domMap', domMap);
goog.exportSymbol('webglMap', webglMap);
