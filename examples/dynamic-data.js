goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.MultiPoint');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.symbol');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
map.beforeRender(function(map, frameState) {
  frameState.animate = true;
  return true;
});
var imageStyle = ol.symbol.renderCircle(5, {
  color: 'yellow'
}, {
  color: 'red',
  width: 1
});
var n = 200;
var omegaTheta = 30000; // Rotation period in ms
var R = 7e6;
var r = 2e6;
var p = 2e6;
map.on('postcompose', function(event) {
  var render = event.getRender();
  var frameState = event.getFrameState();
  var theta = 2 * Math.PI * frameState.time / omegaTheta;
  var coordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    var t = theta + 2 * Math.PI * i / n;
    var x = (R + r) * Math.cos(t) + p * Math.cos((R + r) * t / r);
    var y = (R + r) * Math.sin(t) + p * Math.sin((R + r) * t / r);
    coordinates.push([x, y]);
  }
  render.setImageStyle(imageStyle);
  render.drawMultiPointGeometry(new ol.geom.MultiPoint(coordinates));
});
map.requestRenderFrame();
