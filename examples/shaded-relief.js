goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileJSON');
goog.require('ol.source.Raster');
goog.require('ol.source.XYZ');


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
  var twoPi = 2 * Math.PI;
  var halfPi = Math.PI / 2;
  var cosSunEl = Math.cos(data.sunEl);
  var sinSunEl = Math.sin(data.sunEl);
  var pixelX, pixelY, x0, x1, y0, y1, offset,
      z0, z1, dzdx, dzdy, slope, aspect, cosIncidence, scaled;
  for (pixelY = 0; pixelY <= maxY; ++pixelY) {
    y0 = pixelY === 0 ? 0 : pixelY - 1;
    y1 = pixelY === maxY ? maxY : pixelY + 1;
    for (pixelX = 0; pixelX <= maxX; ++pixelX) {
      x0 = pixelX === 0 ? 0 : pixelX - 1;
      x1 = pixelX === maxX ? maxX : pixelX + 1;

      // determine elevation for (x0, pixelY)
      offset = (pixelY * width + x0) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z0 = pixel[0] + pixel[1] * 2 + pixel[2] * 3;

      // determine elevation for (x1, pixelY)
      offset = (pixelY * width + x1) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z1 = pixel[0] + pixel[1] * 2 + pixel[2] * 3;

      dzdx = (z1 - z0) / dx;

      // determine elevation for (pixelX, y0)
      offset = (y0 * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z0 = pixel[0] + pixel[1] * 2 + pixel[2] * 3;

      // determine elevation for (pixelX, y1)
      offset = (y1 * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      z1 = pixel[0] + pixel[1] * 2 + pixel[2] * 3;

      dzdy = (z1 - z0) / dy;

      slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));

      aspect = Math.atan2(dzdy, -dzdx);
      if (aspect < 0) {
        aspect = halfPi - aspect;
      } else if (aspect > Math.PI / 2) {
        aspect = twoPi - aspect + halfPi;
      } else {
        aspect = halfPi - aspect;
      }

      cosIncidence = sinSunEl * Math.cos(slope) +
          cosSunEl * Math.sin(slope) * Math.cos(data.sunAz - aspect);

      offset = (pixelY * width + pixelX) * 4;
      scaled = 255 * cosIncidence;
      shadeData[offset] = scaled;
      shadeData[offset + 1] = scaled;
      shadeData[offset + 2] = scaled;
      shadeData[offset + 3] = elevationData[offset + 3];
    }
  }

  return [new ImageData(shadeData, width, height)];
}

var elevation = new ol.source.XYZ({
  url: 'https://{a-d}.tiles.mapbox.com/v3/aj.sf-dem/{z}/{x}/{y}.png',
  crossOrigin: 'anonymous'
});

var raster = new ol.source.Raster({
  sources: [elevation],
  operationType: 'image',
  operations: [shade]
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/tschaub.miapgppd.jsonp'
      })
    }),
    new ol.layer.Image({
      opacity: 0.3,
      source: raster
    })
  ],
  view: new ol.View({
    extent: [-13675026, 4439648, -13580856, 4580292],
    center: [-13606539, 4492849],
    minZoom: 10,
    maxZoom: 16,
    zoom: 12
  })
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
