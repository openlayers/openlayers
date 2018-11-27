import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import BingMaps from '../src/ol/source/BingMaps.js';

const key = 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5';

const imagery = new TileLayer({
  source: new BingMaps({key: key, imagerySet: 'Aerial'})
});

const map = new Map({
  layers: [imagery],
  target: 'map',
  view: new View({
    center: fromLonLat([-120, 50]),
    zoom: 6
  })
});

const kernels = {
  none: [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ],
  sharpen: [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ],
  sharpenless: [
    0, -1, 0,
    -1, 10, -1,
    0, -1, 0
  ],
  blur: [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ],
  shadow: [
    1, 2, 1,
    0, 1, 0,
    -1, -2, -1
  ],
  emboss: [
    -2, 1, 0,
    -1, 1, 1,
    0, 1, 2
  ],
  edge: [
    0, 1, 0,
    1, -4, 1,
    0, 1, 0
  ]
};

function normalize(kernel) {
  const len = kernel.length;
  const normal = new Array(len);
  let i, sum = 0;
  for (i = 0; i < len; ++i) {
    sum += kernel[i];
  }
  if (sum <= 0) {
    normal.normalized = false;
    sum = 1;
  } else {
    normal.normalized = true;
  }
  for (i = 0; i < len; ++i) {
    normal[i] = kernel[i] / sum;
  }
  return normal;
}

const select = document.getElementById('kernel');
let selectedKernel = normalize(kernels[select.value]);


/**
 * Update the kernel and re-render on change.
 */
select.onchange = function() {
  selectedKernel = normalize(kernels[select.value]);
  map.render();
};


/**
 * Apply a filter on "postrender" events.
 */
imagery.on('postrender', function(event) {
  convolve(event.context, selectedKernel);
});


/**
 * Apply a convolution kernel to canvas.  This works for any size kernel, but
 * performance starts degrading above 3 x 3.
 * @param {CanvasRenderingContext2D} context Canvas 2d context.
 * @param {Array<number>} kernel Kernel.
 */
function convolve(context, kernel) {
  const canvas = context.canvas;
  const width = canvas.width;
  const height = canvas.height;

  const size = Math.sqrt(kernel.length);
  const half = Math.floor(size / 2);

  const inputData = context.getImageData(0, 0, width, height).data;

  const output = context.createImageData(width, height);
  const outputData = output.data;

  for (let pixelY = 0; pixelY < height; ++pixelY) {
    const pixelsAbove = pixelY * width;
    for (let pixelX = 0; pixelX < width; ++pixelX) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let kernelY = 0; kernelY < size; ++kernelY) {
        for (let kernelX = 0; kernelX < size; ++kernelX) {
          const weight = kernel[kernelY * size + kernelX];
          const neighborY = Math.min(
            height - 1, Math.max(0, pixelY + kernelY - half));
          const neighborX = Math.min(
            width - 1, Math.max(0, pixelX + kernelX - half));
          const inputIndex = (neighborY * width + neighborX) * 4;
          r += inputData[inputIndex] * weight;
          g += inputData[inputIndex + 1] * weight;
          b += inputData[inputIndex + 2] * weight;
          a += inputData[inputIndex + 3] * weight;
        }
      }
      const outputIndex = (pixelsAbove + pixelX) * 4;
      outputData[outputIndex] = r;
      outputData[outputIndex + 1] = g;
      outputData[outputIndex + 2] = b;
      outputData[outputIndex + 3] = kernel.normalized ? a : 255;
    }
  }
  context.putImageData(output, 0, 0);
}
