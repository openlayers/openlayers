import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MousePosition from '../src/ol/control/MousePosition.js';
import {toStringHDMS} from '../src/ol/coordinate.js';
import {Image as ImageLayer, WebGLTile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import {DataTile, OSM, Raster as RasterSource} from '../src/ol/source.js';

const attribution =
  '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Data sources and attribution</a>';

const calculateElevation = function (pixel) {
  if (pixel[3]) {
    return -32768 + (pixel[0] * 256 + pixel[1] + pixel[2] / 256);
  }
};

// Use Float32 interpolation where supported for best results on mobile devices.
const calculateElevationFromData = function (pixel) {
  return pixel[0];
};
const elevation = ['band', 1];
const tileSize = 256;
const gutter = 1;
const canvas = document.createElement('canvas');
canvas.width = tileSize * 3;
canvas.height = tileSize * 3;
const context = canvas.getContext('2d', {willReadFrequently: true});

const source = new DataTile({
  attributions: attribution,
  tileSize: tileSize,
  gutter: gutter,
  maxZoom: 15,
  interpolate: true,
  wrapX: true,
  loader: (z, x, y) => {
    const promises = [];
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        promises.push(
          new Promise((resolve, reject) => {
            const maxY = 2 ** z;
            const yy = y + j - 1;
            if (yy < 0 || yy >= maxY) {
              return resolve();
            }
            const maxX = 2 ** z;
            const xx = (((x + i - 1) % maxX) + maxX) % maxX;
            const image = new Image();
            image.crossOrigin = '';
            image.addEventListener('error', () => reject());
            image.addEventListener('load', () => resolve(image));
            image.src = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${xx}/${yy}.png`;
          }),
        );
      }
    }
    return Promise.all(promises).then((images) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
          const image = images.shift();
          if (image) {
            context.drawImage(image, i * tileSize, j * tileSize);
          }
        }
      }
      const data = context.getImageData(
        tileSize - gutter,
        tileSize - gutter,
        tileSize + 2 * gutter,
        tileSize + 2 * gutter,
      ).data;
      const pixels = data.length / 4;
      const floatData = new Float32Array(data.buffer);
      for (let i = 0, j = 0; i < pixels; ) {
        floatData[i++] = calculateElevation(data.slice(j, (j += 4)));
      }
      return floatData;
    });
  },
});
const pixelValue = ['*', ['+', elevation, 32768], 256];

const style = {
  color: [
    'array',
    ['/', ['floor', ['/', pixelValue, 256 * 256]], 255],
    ['/', ['floor', ['/', ['%', pixelValue, 256 * 256], 256]], 255],
    ['/', ['%', pixelValue, 256], 255],
    1,
  ],
};

/// duplicate layers as one layer shared by two raster sources causes rendering issues
const elevation1 = new TileLayer({
  source: source,
  style: style,
});
const elevation2 = new TileLayer({
  source: source,
  style: style,
});

const contours = function (inputs, data) {
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
          if (
            centerElevation > 0 &&
            leftElevation > 0 &&
            rightElevation > 0 &&
            topElevation > 0 &&
            bottomElevation > 0
          ) {
            contourData[offset] = 0xe0;
            contourData[offset + 1] = 0x94;
            contourData[offset + 2] = 0x5e;
            contourData[offset + 3] = 255;
          } else {
            contourData[offset] = 0x00;
            contourData[offset + 1] = 0xa9;
            contourData[offset + 2] = 0xca;
            contourData[offset + 3] = 255;
          }
        }
      }
    }
  }
  return {data: contourData, width: width, height: height};
};

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

dataLayer.once('postrender', function (event) {
  const gl = event.context;
  if (!gl.getSupportedExtensions().includes('OES_texture_float_linear')) {
    alert('Device does not support float interpolation');
  }
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
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
      const elevation = calculateElevationFromData(pixel);
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
