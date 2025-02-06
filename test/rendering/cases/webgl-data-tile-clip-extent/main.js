import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import DataTile from '../../../../src/ol/source/DataTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const labelCanvasSize = 256;

const labelCanvas = document.createElement('canvas');
labelCanvas.width = labelCanvasSize;
labelCanvas.height = labelCanvasSize;

const labelContext = labelCanvas.getContext('2d');
labelContext.textAlign = 'center';
labelContext.font = '16px sans-serif';
const labelLineHeight = 16;

const tileGrid = createXYZ({maxZoom: 2});

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        tileGrid: tileGrid,
        transition: 0,
      }),
    }),
    new TileLayer({
      source: new DataTile({
        tileGrid: new TileGrid({
          resolutions: tileGrid.getResolutions(),
          origin: tileGrid.getOrigin(),
          extent: [-16e6, -8e6, 16e6, 8e6],
        }),
        loader: function (z, x, y) {
          const half = labelCanvasSize / 2;

          labelContext.clearRect(0, 0, labelCanvasSize, labelCanvasSize);

          labelContext.fillStyle = 'white';
          labelContext.fillText(`z: ${z}`, half, half - labelLineHeight);
          labelContext.fillText(`x: ${x}`, half, half);
          labelContext.fillText(`y: ${y}`, half, half + labelLineHeight);

          labelContext.strokeStyle = 'white';
          labelContext.lineWidth = 10;
          labelContext.strokeRect(0, 0, labelCanvasSize, labelCanvasSize);

          const data = labelContext.getImageData(
            0,
            0,
            labelCanvasSize,
            labelCanvasSize,
          ).data;
          return new Uint8Array(data.buffer);
        },
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([120, 30]),
    zoom: 2,
  }),
});

render({
  message: 'data tiles outside the grid extent are not rendered',
});
