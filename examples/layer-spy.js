goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');

var key = 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3';

var roads = new ol.layer.Tile({
  source: new ol.source.BingMaps({key: key, imagerySet: 'Road'})
});

var imagery = new ol.layer.Tile({
  source: new ol.source.BingMaps({key: key, imagerySet: 'Aerial'})
});

var map = new ol.Map({
  layers: [roads, imagery],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: ol.proj.transform([-109, 46.5], 'EPSG:4326', 'EPSG:3857'),
    zoom: 6
  })
});

var radius = 75;
$(document).keydown(function(evt) {
  if (evt.which === 38) {
    radius = Math.min(radius + 5, 150);
    map.requestRenderFrame();
  } else if (evt.which === 40) {
    radius = Math.max(radius - 5, 25);
    map.requestRenderFrame();
  }
});

// get the pixel position with every move
var mousePosition = null;
$(map.getViewport()).on('mousemove', function(evt) {
  mousePosition = map.getEventPixel(evt.originalEvent);
  map.requestRenderFrame();
}).on('mouseout', function() {
  mousePosition = null;
  map.requestRenderFrame();
});

// before rendering the layer, do some clipping
imagery.on('precompose', function(event) {
  var ctx = event.context;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    ctx.arc(mousePosition[0], mousePosition[1], radius, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  }
  ctx.clip();
});

// after rendering the layer, restore the canvas context
imagery.on('postcompose', function(event) {
  var ctx = event.context;
  ctx.restore();
});
