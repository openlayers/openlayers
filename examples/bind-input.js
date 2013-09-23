goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.webgl');


if (!ol.webgl.SUPPORTED) {
  var inputs = document.getElementsByClassName('webgl');
  for (var i = 0, len = inputs.length; i < len; i++) {
    inputs[i].disabled = true;
  }
  var info = document.getElementById('no-webgl');
  /**
   * display warning message
   */
  info.style.display = '';
}

var layer = new ol.layer.Tile({
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
opacity.bindTo('valueAsNumber', layer, 'opacity');

var hue = new ol.dom.Input(document.getElementById('hue'));
hue.bindTo('valueAsNumber', layer, 'hue');

var saturation = new ol.dom.Input(document.getElementById('saturation'));
saturation.bindTo('valueAsNumber', layer, 'saturation');

var contrast = new ol.dom.Input(document.getElementById('contrast'));
contrast.bindTo('valueAsNumber', layer, 'contrast');

var brightness = new ol.dom.Input(document.getElementById('brightness'));
brightness.bindTo('valueAsNumber', layer, 'brightness');


var rotation = new ol.dom.Input(document.getElementById('rotation'));
rotation.bindTo('valueAsNumber', map.getView(), 'rotation');

var resolution = new ol.dom.Input(document.getElementById('resolution'));
resolution.bindTo('valueAsNumber', map.getView(), 'resolution');
