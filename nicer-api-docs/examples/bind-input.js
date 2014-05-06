if (!ol.BrowserFeature.HAS_WEBGL) {
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

var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [layer],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
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
