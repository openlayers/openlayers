import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const size = [81, 99];

const canvas = document.createElement('canvas');
canvas.width = size[0];
canvas.height = size[1];

const context = canvas.getContext('2d');
context.strokeStyle = 'white';
context.textAlign = 'center';
const lineHeight = 16;
context.font = `${lineHeight}px sans-serif`;

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        tileSize: size,
        loader: function (z, x, y) {
          const halfW = size[0] / 2;
          const halfH = size[1] / 2;
          context.fillStyle = '#00AAFF';
          context.fillRect(0, 0, size[0], size[1]);
          context.fillStyle = 'white';
          context.fillText(`z: ${z}`, halfW, halfH - lineHeight);
          context.fillText(`x: ${x}`, halfW, halfH);
          context.fillText(`y: ${y}`, halfW, halfH + lineHeight);
          context.strokeRect(0, 0, size[0], size[1]);

          const input = context.getImageData(0, 0, size[0], size[1]).data;
          const bandCount = input.length / (size[0] * size[1]);
          const inputColCount = bandCount * size[0];

          const packAlignment = 8;
          const outputColCount =
            Math.ceil((bandCount * size[0]) / packAlignment) * packAlignment;
          const output = new Uint8Array(outputColCount * size[1]);

          for (let row = 0; row < size[1]; ++row) {
            let inputOffset = row * inputColCount;
            let outputOffset = row * outputColCount;
            for (let col = 0; col < inputColCount; col += bandCount) {
              for (let band = 0; band < bandCount; ++band) {
                output[outputOffset] = input[inputOffset];
                inputOffset += 1;
                outputOffset += 1;
              }
            }
          }

          return output;
        },
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});

render({tolerance: 0.03});
