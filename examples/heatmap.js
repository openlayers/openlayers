// FIXME handle view rotation
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.ImageCanvas');
goog.require('ol.source.KML');
goog.require('ol.source.Stamen');
goog.require('ol.source.State');


var palette = (function() {
  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  var context = canvas.getContext('2d');
  var gradient = context.createLinearGradient(0, 0, 1, 256);
  // blue, cyan, green, yellow, red
  gradient.addColorStop(0.00, 'rgb(0,0,255)');
  gradient.addColorStop(0.25, 'rgb(0,255,255)');
  gradient.addColorStop(0.50, 'rgb(0,255,0)');
  gradient.addColorStop(0.75, 'rgb(255,255,0)');
  gradient.addColorStop(1.00, 'rgb(255,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, 256);

  return context.getImageData(0, 0, 1, 256).data;
})();


var vectorSource = new ol.source.KML({
  url: 'data/kml/2012_Earthquakes_Mag5.kml',
  projection: 'EPSG:3857'
});

vectorSource.on('addfeature', function(event) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var feature = event.feature;
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  feature.set('weight', magnitude / 6.0);
});

vectorSource.on('change', function(event) {
  if (vectorSource.getState() == ol.source.State.READY) {
    map.addLayer(new ol.layer.Image({
      source: new ol.source.ImageCanvas({
        canvasFunction: postcompose,
        ratio: 1
      })
    }));
  }
});


var postcompose = function(extent, resolution, pixelRatio, size, projection) {
  var shadowOffset = 1000 * pixelRatio;
  var shadowBlur = 15 * pixelRatio;
  var radius = 8 * pixelRatio;
  var canvas = document.createElement('canvas');
  canvas.width = size[0];
  canvas.height = size[1];

  var context = canvas.getContext('2d');
  context.shadowOffsetX = context.shadowOffsetY = shadowOffset;
  context.shadowBlur = shadowBlur;

  vectorSource.forEachFeatureInExtent(extent, function(feature) {
    var geometry = /** @type {ol.geom.Point} */ (feature.getGeometry());
    var weight = feature.get('weight');
    var pixel = map.getPixelFromCoordinate(geometry.getCoordinates());
    var x = pixel[0] * pixelRatio - shadowOffset;
    var y = pixel[1] * pixelRatio - shadowOffset;
    context.shadowColor = 'rgba(0, 0, 0, ' + weight + ')';
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, true);
    context.fill();
  });

  var image = context.getImageData(0, 0, canvas.width, canvas.height);
  var data = image.data;
  for (var i = 0; i < data.length; i += 4) {
    var alpha = data[i + 3];
    if (alpha > 0) {
      var offset = alpha * 4;
      data[i] = palette[offset];
      data[i + 1] = palette[offset + 1];
      data[i + 2] = palette[offset + 2];
    }
  }
  image.data = data;
  context.putImageData(image, 0, 0);

  return canvas;
};

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.Stamen({
        layer: 'toner-background'
      })
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
