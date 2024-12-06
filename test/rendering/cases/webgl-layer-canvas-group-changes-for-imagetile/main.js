import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LayerGroup from '../../../../src/ol/layer/Group.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import DataTile from '../../../../src/ol/source/DataTile.js';
import ImageTile from '../../../../src/ol/source/ImageTile.js';

const canvasSize = 256;

const canvas = document.createElement('canvas');
canvas.width = canvasSize;
canvas.height = canvasSize;

const context = canvas.getContext('2d');

const lg = new LayerGroup();
const vl = new VectorLayer();

const map = new Map({
  layers: [
    new TileLayer({
      source: new DataTile({
        wrapX: true,
        loader: function () {
          context.fillStyle = 'red';
          context.fillRect(0, 0, canvasSize, canvasSize);

          const data = context.getImageData(0, 0, canvasSize, canvasSize).data;
          return new Uint8Array(data.buffer);
        },
        transition: 0,
      }),
    }),

    lg,

    new TileLayer({
      source: new ImageTile({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 100,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [15180597.9736, 2700366.3807],
    zoom: 2,
  }),
});

map.once('rendercomplete', function () {
  lg.getLayers().push(vl);
  map.renderSync();
  render({
    message: "The ImageTile shouldn't flicker if the layer group changes",
  });
});
