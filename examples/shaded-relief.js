goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.Raster');
goog.require('ol.source.TileWMS');


function read3x3(imageData, callback) {
  var size = 3;
  var mid = 1;
  var width = imageData.width;
  var height = imageData.height;
  var data = imageData.data;
  var kernel = new Array(size * size);
  for (var n = 0, nn = kernel.length; n < nn; ++n) {
    kernel[n] = [0, 0, 0, 0];
  }
  var offsetMin = (1 - size) / 2;
  for (var pixelY = 0; pixelY < height; ++j) {
    for (var pixelX = 0; pixelX < width; ++i) {
      for (var kernelY = 0; kernelY < size; ++kernelY) {
        var neighborY = Math.max(pixelY - (kernelY - mix), 0);
        for (var kernelX = 0; kernelX < size; ++kernelX) {
          var neighborX = Math.max(pixelX - (kernelX - mid), 0);
          var kernelIndex = kernelX + kernelY * size;
          var dataIndex = 4 * (neighborY * width + neighborX);
          kernel[kernelIndex][0] = data[dataIndex];
          kernel[kernelIndex][1] = data[dataIndex + 1];
          kernel[kernelIndex][2] = data[dataIndex + 2];
          kernel[kernelIndex][3] = data[dataIndex + 3];
        }
      }
      callback(kernel, pixelX, pixelY);
    }
  }
}

/**
 * The NED dataset is symbolized by a color ramp that maps the following
 * elevations to corresponding RGB values.  This operation is used to
 * invert the mapping - returning elevations in meters for a pixel RGB array.
 *
 *  -20m : 0, 0, 0
 *  400m : 0, 0, 255
 *  820m : 0, 255, 255
 * 1240m : 255, 255, 255
 *
 */
function getElevation(pixel) {
  return (420 * (pixel[0] + pixel[1] + pixel[2]) / 255) - 20;
}

/**
 * Generates a shaded relief image given elevation data.  Uses a 3x3
 * neighborhood for determining slope and aspect.
 * @param {Array.<ImageData>} inputs Array of input images.
 * @param {Object} data Data with resolution property.
 * @return {Array.<ImageData>} Output images (only the first is rendered).
 */
function shade(inputs, data) {
  var elevationImage = inputs[0];
  var width = elevationImage.width;
  var height = elevationImage.height;
  var elevationData = elevationImage.data;
  var shadeData = new Uint8ClampedArray(elevationData.length);
  var dx = dy = data.resolution * 2;
  var maxX = width - 1;
  var maxY = height - 1;
  var pixel = [0, 0, 0, 0];
  var offset, z0, z1, dzdx, dzdy, slope, aspect, scaled;
  for (var pixelY = 0; pixelY <= maxY; ++pixelY) {
    var y0 = pixelY === 0 ? 0 : pixelY - 1;
    var y1 = pixelY === maxY ? maxY : pixelY + 1;
    for (var pixelX = 0; pixelX <= maxX; ++pixelX) {
      var x0 = pixelX === 0 ? 0 : pixelX - 1;
      var x1 = pixelX === maxX ? maxX : pixelX + 1;

      // determine x0, pixelY elevation
      offset = (pixelY * width + x0) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z0 = getElevation(pixel);

      // determine x1, pixelY elevation
      offset = (pixelY * width + x1) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z1 = getElevation(pixel);

      dzdx = (z1 - z0) / dx;

      // determine pixelX, y0 elevation
      offset = (y0 * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z0 = getElevation(pixel);

      // determine pixelX, y1 elevation
      offset = (y1 * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z1 = getElevation(pixel);

      dzdy = (z1 - z0) / dy;

      slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      aspect = Math.atan2(dzdy, -dzdx);
      if (aspect < 0) {
        aspect = (Math.PI / 2) - aspect;
      } else if (aspect > Math.PI / 2) {
        aspect = (2 * Math.PI) - aspect + (Math.PI / 2);
      } else {
        aspect = Math.PI / 2 - aspect;
      }

      cosIncidence = Math.sin(data.sunEl) * Math.cos(slope) +
        Math.cos(data.sunEl) * Math.sin(slope) * Math.cos(data.sunAz - aspect);


      scaled = 255 * cosIncidence;

      offset = (pixelY * width + pixelX) * 4;
      shadeData[offset] = scaled;
      shadeData[offset + 1] = scaled;
      shadeData[offset + 2] = scaled;
      shadeData[offset + 3] = elevationData[offset + 3];
    }
  }

  return [new ImageData(shadeData, width, height)];
}

var elevation = new ol.source.TileWMS({
  url: 'http://demo.opengeo.org/geoserver/wms',
  params: {'LAYERS': 'usgs:ned', 'TILED': true, 'FORMAT': 'image/png'},
  crossOrigin: 'anonymous',
  serverType: 'geoserver'
});

var raster = new ol.source.Raster({
  sources: [elevation],
  operationType: 'image',
  operations: [shade]
});

var sunElevationInput = document.getElementById('sun-el');
var sunAzimuthInput = document.getElementById('sun-az');

sunElevationInput.addEventListener('input', function() {
  raster.changed();
});

sunAzimuthInput.addEventListener('input', function() {
  raster.changed();
});

raster.on('beforeoperations', function(event) {
  // the event.data object will be passed to operations
  event.data.resolution = event.resolution;
  event.data.sunEl = Math.PI * sunElevationInput.value / 180;
  event.data.sunAz = Math.PI * sunAzimuthInput.value / 180;
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Image({
      source: raster
    })
  ],
  view: new ol.View({
    center: [-8610263, 4747090],
    zoom: 10
  })
});
