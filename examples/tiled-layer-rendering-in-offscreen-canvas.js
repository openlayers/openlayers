import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageTileSource from '../src/ol/source/ImageTile.js';
import Worker from 'worker-loader!./tiled-layer-rendering-in-offscreen-canvas.worker.js'; //eslint-disable-line
const worker = new Worker();

const tileQueue = [];

new Map({
  layers: [
    new TileLayer({
      source: new ImageTileSource({
        tileSize: 512,
        loader: (z, x, y) => {
          return new Promise((resolve) => {
            const loadTile = () => {
              const handleMessage = ({data: {action, imageData}}) => {
                if (action !== 'rendered') {
                  return;
                }
                worker.removeEventListener('message', handleMessage);
                resolve(imageData);
                tileQueue.shift();
                const loadNextTile = tileQueue[0];
                loadNextTile?.();
              };
              worker.addEventListener('message', handleMessage);
              worker.postMessage({action: 'render', tile: [z, x, y]});
            };
            if (tileQueue.length === 0) {
              loadTile();
            }
            tileQueue.push(loadTile);
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
    center: [0, 0],
    zoom: 2,
  }),
});
