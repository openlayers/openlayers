goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map({
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  target: 'map',
  zoom: 2
});
