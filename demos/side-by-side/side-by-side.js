goog.require('ol.RendererHint');
goog.require('ol.control.Keyboard');
goog.require('ol.createMap');
goog.require('ol.layer.MapQuestOpenAerial');
goog.require('ol.view.Attribution');


var layer = new ol.layer.MapQuestOpenAerial();

var layers = new ol.Collection();
layers.push(layer);

var domMap = ol.createMap(
    document.getElementById('domMap'),
    {'layers': layers},
    ol.RendererHint.DOM);
domMap.setCenter(new ol.Coordinate(0, 0));
domMap.setResolution(layer.getStore().getResolutions()[0]);

var webglMap = ol.createMap(
    document.getElementById('webglMap'),
    {},
    ol.RendererHint.WEBGL);
webglMap.bindTo('center', domMap);
webglMap.bindTo('layers', domMap);
webglMap.bindTo('resolution', domMap);
webglMap.bindTo('rotation', domMap);

var attributionView = new ol.view.Attribution(domMap);
document.getElementById('attribution').appendChild(
    attributionView.getElement());

var keyboardControl = new ol.control.Keyboard();
keyboardControl.addCallback('0', function() {
  layer.setBrightness(0);
  layer.setContrast(0);
  layer.setHue(0);
  layer.setSaturation(0);
  layer.setOpacity(1);
  layer.setVisible(true);
});
keyboardControl.addCallback('b', function() {
  layer.setBrightness(layer.getBrightness() - 0.1);
});
keyboardControl.addCallback('B', function() {
  layer.setBrightness(layer.getBrightness() + 0.1);
});
keyboardControl.addCallback('c', function() {
  layer.setContrast(layer.getContrast() - 0.1);
});
keyboardControl.addCallback('C', function() {
  layer.setContrast(layer.getContrast() + 0.1);
});
keyboardControl.addCallback('h', function() {
  layer.setHue(layer.getHue() - 0.1);
});
keyboardControl.addCallback('H', function() {
  layer.setHue(layer.getHue() + 0.1);
});
keyboardControl.addCallback('o', function() {
  layer.setOpacity(layer.getOpacity() - 0.1);
});
keyboardControl.addCallback('O', function() {
  layer.setOpacity(layer.getOpacity() + 0.1);
});
keyboardControl.addCallback('s', function() {
  layer.setSaturation(layer.getSaturation() - 0.1);
});
keyboardControl.addCallback('S', function() {
  layer.setSaturation(layer.getSaturation() + 0.1);
});
keyboardControl.addCallback('vV', function() {
  layer.setVisible(!layer.getVisible());
});
domMap.getControls().push(keyboardControl);

goog.exportSymbol('layer', layer);
goog.exportSymbol('layers', layers);
goog.exportSymbol('domMap', domMap);
goog.exportSymbol('webglMap', webglMap);
