goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.dom.Input');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


function checkWebGL(evt) {
  document.getElementById('no-webgl').style.display =
      ol.has.WEBGL ? 'none' : '';
  document.getElementById('has-webgl').style.display =
      ol.has.WEBGL && !evt.glContext ? '' : 'none';
  document.getElementById('webgl').style.display =
      evt.glContext ? '' : 'none';
}

var layer = new ol.layer.Tile({
  source: new ol.source.OSM()
});
layer.once('precompose', checkWebGL);

var view = new ol.View({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [layer],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

var visible = new ol.dom.Input(document.getElementById('visible'));
visible.bindTo('checked', layer, 'visible');

var opacity = new ol.dom.Input(document.getElementById('opacity'));
opacity.bindTo('value', layer, 'opacity')
    .transform(parseFloat, String);

var hue = new ol.dom.Input(document.getElementById('hue'));
hue.bindTo('value', layer, 'hue')
    .transform(parseFloat, String);

var saturation = new ol.dom.Input(document.getElementById('saturation'));
saturation.bindTo('value', layer, 'saturation')
    .transform(parseFloat, String);

var contrast = new ol.dom.Input(document.getElementById('contrast'));
contrast.bindTo('value', layer, 'contrast')
    .transform(parseFloat, String);

var brightness = new ol.dom.Input(document.getElementById('brightness'));
brightness.bindTo('value', layer, 'brightness')
    .transform(parseFloat, String);


var rotation = new ol.dom.Input(document.getElementById('rotation'));
rotation.bindTo('value', view, 'rotation').transform(parseFloat, String);

var resolution = new ol.dom.Input(document.getElementById('resolution'));
resolution.bindTo('value', view, 'resolution').transform(parseFloat, String);
