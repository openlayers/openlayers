goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.CoordinateFormat');
goog.require('ol.Map');
goog.require('ol.RendererHint');
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

var domMap = new ol.Map({
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  renderer: ol.RendererHint.DOM,
  target: 'domMap',
  zoom: 1
});

domMap.getControls().push(new ol.control.MousePosition({
  coordinateFormat: ol.CoordinateFormat.hdms,
  projection: ol.Projection.getFromCode('EPSG:4326'),
  target: document.getElementById('domMousePosition'),
  undefinedHtml: '&nbsp;'
}));

var webglMap = new ol.Map({
  renderer: ol.RendererHint.WEBGL,
  target: 'webglMap'
});
if (!goog.isNull(webglMap)) {
  webglMap.bindTo('center', domMap);
  webglMap.bindTo('layers', domMap);
  webglMap.bindTo('resolution', domMap);
  webglMap.bindTo('rotation', domMap);
}

webglMap.getControls().push(new ol.control.MousePosition({
  coordinateFormat: ol.CoordinateFormat.hdms,
  projection: ol.Projection.getFromCode('EPSG:4326'),
  target: document.getElementById('webglMousePosition'),
  undefinedHtml: '&nbsp;'
}));

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
