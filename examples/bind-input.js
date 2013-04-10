goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');

var layer = new ol.layer.TileLayer({
  source: new ol.source.OSM()
});
var map = new ol.Map({
  layers: [layer],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var visible = new ol.dom.Input(document.getElementById('visible'));
visible.bindTo('checked', layer, 'visible');

var opacity = new ol.dom.Input(document.getElementById('opacity'));
opacity.bindTo('value', layer, 'opacity');

var hue = new ol.dom.Input(document.getElementById('hue'));
hue.bindTo('value', layer, 'hue');

var saturation = new ol.dom.Input(document.getElementById('saturation'));
saturation.bindTo('value', layer, 'saturation');

var contrast = new ol.dom.Input(document.getElementById('contrast'));
contrast.bindTo('value', layer, 'contrast');

var brightness = new ol.dom.Input(document.getElementById('brightness'));
brightness.bindTo('value', layer, 'brightness');


var rotation = new ol.dom.Input(document.getElementById('rotation'));
rotation.bindTo('value', map.getView(), 'rotation');
