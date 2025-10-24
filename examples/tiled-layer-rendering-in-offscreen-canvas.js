import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageTileSource from '../src/ol/source/ImageTile.js';
import Worker from 'worker-loader!./tiled-layer-rendering-in-offscreen-canvas.worker.js'; //eslint-disable-line
import {createXYZ} from '../src/ol/tilegrid.js';

const worker = new Worker();

const tileQueue = [];

new Map({
  layers: [
    new TileLayer({
      source: new ImageTileSource({
        tileSize: [512, 512],
        loader: (x, y, z) => {
          return new Promise((resolve) => {
            const queueIsEmpty = !tileQueue.length;
            tileQueue.push({
              tile: {x, y, z},
              loadTile: function () {
                const handleMessage = (message) => {
                  if (message.data.action !== 'rendered') {
                    return;
                  }
                  worker.removeEventListener('message', handleMessage);
                  resolve(message.data.imageData);
                  tileQueue.shift();
                  if (tileQueue.length) {
                    tileQueue[0].loadTile();
                  }
                };
                worker.addEventListener('message', handleMessage);
                worker.postMessage({
                  action: 'render',
                  tile: {x, y, z},
                });
              },
            });
            if (queueIsEmpty) {
              tileQueue[0].loadTile();
            }
          });
        },
        attributions: [
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        ],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    resolutions: createXYZ({tileSize: 512}).getResolutions(),
    center: [0, 0],
    zoom: 2,
  }),
});
