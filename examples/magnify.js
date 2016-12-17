goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');

var key = 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5';

var imagery = new ol.layer.Tile({
  source: new ol.source.BingMaps({key: key, imagerySet: 'Aerial'})
});

var container = document.getElementById('map');

var map = new ol.Map({
  layers: [imagery],
  target: container,
  view: new ol.View({
    center: ol.proj.fromLonLat([-109, 46.5]),
    zoom: 6
  })
});

var radius = 75;
document.addEventListener('keydown', function(evt) {
  if (evt.which === 38) {
    radius = Math.min(radius + 5, 150);
    map.render();
    evt.preventDefault();
  } else if (evt.which === 40) {
    radius = Math.max(radius - 5, 25);
    map.render();
    evt.preventDefault();
  }
});

// get the pixel position with every move
var mousePosition = null;

container.addEventListener('mousemove', function(event) {
  mousePosition = map.getEventPixel(event);
  map.render();
});

container.addEventListener('mouseout', function() {
  mousePosition = null;
  map.render();
});

// after rendering the layer, show an oversampled version around the pointer
imagery.on('postcompose', function(event) {
  if (mousePosition) {
    var context = event.context;
    var pixelRatio = event.frameState.pixelRatio;
    var half = radius * pixelRatio;
    var centerX = mousePosition[0] * pixelRatio;
    var centerY = mousePosition[1] * pixelRatio;
    var originX = centerX - half;
    var originY = centerY - half;
    var size = 2 * half + 1;
    var sourceData = context.getImageData(originX, originY, size, size).data;
    var dest = context.createImageData(size, size);
    var destData = dest.data;
    for (var j = 0; j < size; ++j) {
      for (var i = 0; i < size; ++i) {
        var dI = i - half;
        var dJ = j - half;
        var dist = Math.sqrt(dI * dI + dJ * dJ);
        var sourceI = i;
        var sourceJ = j;
        if (dist < half) {
          sourceI = Math.round(half + dI / 2);
          sourceJ = Math.round(half + dJ / 2);
        }
        var destOffset = (j * size + i) * 4;
        var sourceOffset = (sourceJ * size + sourceI) * 4;
        destData[destOffset] = sourceData[sourceOffset];
        destData[destOffset + 1] = sourceData[sourceOffset + 1];
        destData[destOffset + 2] = sourceData[sourceOffset + 2];
        destData[destOffset + 3] = sourceData[sourceOffset + 3];
      }
    }
    context.beginPath();
    context.arc(centerX, centerY, half, 0, 2 * Math.PI);
    context.lineWidth = 3 * pixelRatio;
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.putImageData(dest, originX, originY);
    context.stroke();
    context.restore();
  }
});
