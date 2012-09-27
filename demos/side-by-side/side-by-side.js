goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.CoordinateFormat');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.control.Attribution');
goog.require('ol.control.MousePosition');
goog.require('ol.interaction.Keyboard');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var domMap = new ol.Map(document.getElementById('domMap'), {
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  renderer: ol.RendererHint.DOM,
  zoom: 0
});

var webglMap = new ol.Map(document.getElementById('webglMap'), {
  renderer: ol.RendererHint.WEBGL
});
if (!goog.isNull(webglMap)) {
  webglMap.bindTo('center', domMap);
  webglMap.bindTo('layers', domMap);
  webglMap.bindTo('resolution', domMap);
  webglMap.bindTo('rotation', domMap);
}

var attributionControl = new ol.control.Attribution(domMap);
document.getElementById('attribution').appendChild(
    attributionControl.getElement());

var domMousePositionControl = new ol.control.MousePosition(domMap,
    ol.Projection.getFromCode('EPSG:4326'), ol.CoordinateFormat.hdms,
    '&nbsp;');
document.getElementById('domMousePosition').appendChild(
    domMousePositionControl.getElement());

var webglMousePositionControl = new ol.control.MousePosition(webglMap,
    ol.Projection.getFromCode('EPSG:4326'), ol.CoordinateFormat.hdms,
    '&nbsp;');
document.getElementById('webglMousePosition').appendChild(
    webglMousePositionControl.getElement());

var keyboardInteraction = new ol.interaction.Keyboard();
keyboardInteraction.addCallback('0', function() {
  layer.setBrightness(0);
  layer.setContrast(0);
  layer.setHue(0);
  layer.setSaturation(0);
  layer.setOpacity(1);
  layer.setVisible(true);
});
keyboardInteraction.addCallback('b', function() {
  layer.setBrightness(layer.getBrightness() - 0.1);
});
keyboardInteraction.addCallback('B', function() {
  layer.setBrightness(layer.getBrightness() + 0.1);
});
keyboardInteraction.addCallback('c', function() {
  layer.setContrast(layer.getContrast() - 0.1);
});
keyboardInteraction.addCallback('C', function() {
  layer.setContrast(layer.getContrast() + 0.1);
});
keyboardInteraction.addCallback('h', function() {
  layer.setHue(layer.getHue() - 0.1);
});
keyboardInteraction.addCallback('H', function() {
  layer.setHue(layer.getHue() + 0.1);
});
keyboardInteraction.addCallback('o', function() {
  layer.setOpacity(layer.getOpacity() - 0.1);
});
keyboardInteraction.addCallback('O', function() {
  layer.setOpacity(layer.getOpacity() + 0.1);
});
keyboardInteraction.addCallback('r', function() {
  webglMap.setRotation(0);
});
keyboardInteraction.addCallback('s', function() {
  layer.setSaturation(layer.getSaturation() - 0.1);
});
keyboardInteraction.addCallback('S', function() {
  layer.setSaturation(layer.getSaturation() + 0.1);
});
keyboardInteraction.addCallback('vV', function() {
  layer.setVisible(!layer.getVisible());
});
domMap.getInteractions().push(keyboardInteraction);
