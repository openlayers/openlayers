goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.interaction.Keyboard');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');


var LONDON = ol.projection.transformWithCodes(
    new ol.Coordinate(-0.12755, 51.507222), 'EPSG:4326', 'EPSG:3857');
var MOSCOW = ol.projection.transformWithCodes(
    new ol.Coordinate(37.6178, 55.7517), 'EPSG:4326', 'EPSG:3857');

var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var view = new ol.View2D({
  center: new ol.Coordinate(0, 0),
  zoom: 1
});

var domMap = new ol.Map({
  layers: new ol.Collection([layer]),
  renderer: ol.RendererHint.DOM,
  target: 'domMap',
  view: view
});

var webglMap = new ol.Map({
  renderer: ol.RendererHint.WEBGL,
  target: 'webglMap'
});
if (webglMap !== null) {
  webglMap.bindTo('layers', domMap);
  webglMap.bindTo('view', domMap);
}


var canvasMap = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  target: 'canvasMap'
});
if (canvasMap !== null) {
  canvasMap.bindTo('layers', domMap);
  canvasMap.bindTo('view', domMap);
}

var keyboardInteraction = new ol.interaction.Keyboard();
keyboardInteraction.addCallback('0', function() {
  layer.setOpacity(1);
  layer.setVisible(true);
});
keyboardInteraction.addCallback('o', function() {
  layer.setOpacity(layer.getOpacity() - 0.125);
});
keyboardInteraction.addCallback('O', function() {
  layer.setOpacity(layer.getOpacity() + 0.125);
});
keyboardInteraction.addCallback('r', function() {
  view.setRotation(0);
});
keyboardInteraction.addCallback('vV', function() {
  layer.setVisible(!layer.getVisible());
});
domMap.getInteractions().push(keyboardInteraction);
