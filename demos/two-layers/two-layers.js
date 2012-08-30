goog.require('ol3.Coordinate');
goog.require('ol3.RendererHint');
goog.require('ol3.control.Attribution');
goog.require('ol3.createMap');
goog.require('ol3.layer.BingMaps');
goog.require('ol3.layer.TileJSON');


var layer1 = new ol3.layer.BingMaps(
    ol3.BingMapsStyle.AERIAL,
    'AheP841R-MsLErKQChaTba_xDoOCl40-EeTubD9uNhNAyQTePwFY9iVD1_pyqqlE');
var layer2 = new ol3.layer.TileJSON(
    'http://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.jsonp');

var layers = new ol3.Collection([layer1, layer2]);

var webglMap = ol3.createMap(
    document.getElementById('webglMap'),
    {'layers': new ol3.Collection([layer1, layer2])},
    ol3.RendererHint.WEBGL);

goog.events.listen(layer2, goog.events.EventType.LOAD, function() {
  webglMap.setUserCenter(new ol3.Coordinate(-77.93254999999999, 37.9555));
  webglMap.setResolution(layer2.getStore().getResolutions()[5]);
});

var domMap = ol3.createMap(
    document.getElementById('domMap'),
    {},
    ol3.RendererHint.DOM);
domMap.bindTo('center', webglMap);
domMap.bindTo('layers', webglMap);
domMap.bindTo('resolution', webglMap);
domMap.bindTo('rotation', webglMap);

var attributionControl = new ol3.control.Attribution(webglMap);
document.getElementById('attribution').appendChild(
    attributionControl.getElement());

goog.exportSymbol('layer1', layer1);
goog.exportSymbol('layer2', layer2);
goog.exportSymbol('layers', layers);
goog.exportSymbol('domMap', domMap);
goog.exportSymbol('webglMap', webglMap);
