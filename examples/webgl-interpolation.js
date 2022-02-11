import Map from '../src/ol/Map.js';
import MousePosition from '../src/ol/control/MousePosition.js';
import View from '../src/ol/View.js';
import {Image as ImageLayer, WebGLTile as TileLayer} from '../src/ol/layer.js';
import {Raster as RasterSource, XYZ} from '../src/ol/source.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import {toStringHDMS} from '../src/ol/coordinate.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

// The elevation is (pixelValue * 0.1) - 10000
// but pixelValue is sufficient for interpolation

function calculateElevation(pixel) {
  if (pixel[3]) {
    return -10000 + (pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1;
  }
}

const pixelValue = [
  '*',
  255,
  [
    '+',
    ['*', 256 * 256, ['band', 1]],
    ['+', ['*', 256, ['band', 2]], ['band', 3]],
  ],
];

const style = {
  color: [
    'array',
    ['/', ['floor', ['/', pixelValue, 256 * 256]], 255],
    ['/', ['floor', ['/', ['%', pixelValue, 256 * 256], 256]], 255],
    ['/', ['%', pixelValue, 256], 255],
    1,
  ],
};

const source = new XYZ({
  attributions: attributions,
  url:
    'https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=' + key,
  tileSize: 512,
  maxZoom: 14,
});

// duplicate layers as one layer shared by two raster sources causes rendering issues
const elevation1 = new TileLayer({
  source: source,
  style: style,
});
const elevation2 = new TileLayer({
  source: source,
  style: style,
});

function contours(inputs, data) {
  const elevationImage = inputs[0];
  const width = elevationImage.width;
  const height = elevationImage.height;
  const elevationData = elevationImage.data;
  const pixel = [0, 0, 0, 0];
  const contourData = new Uint8ClampedArray(elevationData.length);
  const interval = data.interval;

  let offset, pixelY, pixelX;
  for (pixelY = 0; pixelY < height; ++pixelY) {
    for (pixelX = 0; pixelX < width; ++pixelX) {
      offset = (pixelY * width + Math.max(pixelX - 1, 0)) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      const leftElevation = calculateElevation(pixel);

      offset = (pixelY * width + Math.min(pixelX + 1, width - 1)) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      const rightElevation = calculateElevation(pixel);

      offset = (Math.max(pixelY - 1, 0) * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      const topElevation = calculateElevation(pixel);

      offset = (Math.min(pixelY + 1, height - 1) * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      const bottomElevation = calculateElevation(pixel);

      offset = (pixelY * width + pixelX) * 4;
      pixel[0] = elevationData[offset];
      pixel[1] = elevationData[offset + 1];
      pixel[2] = elevationData[offset + 2];
      pixel[3] = elevationData[offset + 3];
      const centerElevation = calculateElevation(pixel);

      if (
        leftElevation !== undefined &&
        rightElevation !== undefined &&
        topElevation !== undefined &&
        bottomElevation !== undefined &&
        centerElevation !== undefined
      ) {
        const contour = Math.floor(centerElevation / interval);
        if (
          contour !== Math.floor(leftElevation / interval) ||
          contour !== Math.floor(rightElevation / interval) ||
          contour !== Math.floor(topElevation / interval) ||
          contour !== Math.floor(bottomElevation / interval)
        ) {
          contourData[offset] = 180;
          contourData[offset + 1] = 84;
          contourData[offset + 2] = 18;
          contourData[offset + 3] = 255;
        }
      }
    }
  }
  return {data: contourData, width: width, height: height};
}

const contourSource = new RasterSource({
  sources: [elevation1],
  operationType: 'image',
  operation: contours,
  lib: {
    calculateElevation: calculateElevation,
  },
  resolutions: null,
});

contourSource.on('beforeoperations', function (event) {
  const data = event.data;
  if (event.resolution < 5) {
    data.interval = 10;
  } else if (event.resolution < 25) {
    data.interval = 50;
  } else if (event.resolution < 50) {
    data.interval = 100;
  } else if (event.resolution < 250) {
    data.interval = 500;
  } else {
    data.interval = 1000;
  }
});

const contourLayer = new ImageLayer({
  source: contourSource,
  opacity: 0.5,
});

const elevationLayer = new ImageLayer({
  source: new RasterSource({
    sources: [elevation2],
    operation: function (pixels) {
      return pixels[0];
    },
    resolutions: null,
  }),
  opacity: 0,
});

const dataLayer = new TileLayer({
  source: source,
  style: {color: ['array', 0, 0, 0, 0]},
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=' + key,
        tileSize: 512,
        maxZoom: 22,
      }),
    }),
    dataLayer,
    contourLayer,
    elevationLayer,
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-78.8175, -1.469167]),
    zoom: 17,
    maxZoom: 21,
  }),
});

const mousePositionControl = new MousePosition({
  className: 'custom-mouse-position',
  target: 'info',
  wrapX: false,
  coordinateFormat: function (coordinate) {
    let position = 'Position ' + toStringHDMS(toLonLat(coordinate)) + '<br>';
    let pixel = elevationLayer.getData(map.getPixelFromCoordinate(coordinate));
    if (pixel) {
      const elevation = calculateElevation(pixel);
      if (elevation !== undefined) {
        position += 'Elevation ' + elevation.toFixed(1) + ' meters';
      }
    }
    position += '<br><br>';

    pixel = dataLayer.getData(map.getPixelFromCoordinate(coordinate));
    if (pixel) {
      const elevation = calculateElevation(pixel);
      if (elevation !== undefined) {
        position += 'Data value ' + elevation.toFixed(1) + ' meters';
      }
    }
    position += '<br>';
    return position;
  },
  placeholder: '<br><br><br><br>',
});
map.addControl(mousePositionControl);
