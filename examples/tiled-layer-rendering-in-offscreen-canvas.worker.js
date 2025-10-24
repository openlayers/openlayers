import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile';
import {OSM} from 'ol/source';
import {createXYZ} from 'ol/tilegrid';

const worker = self;

const tileGrid = createXYZ({
  tileSize: [512, 512],
});

const canvas = new OffscreenCanvas(512, 512);

const map = new Map({
  target: canvas,
  layers: [
    new TileLayer({
      source: new OSM({
        tileGrid,
      }),
    }),
  ],
  controls: [],
  interactions: [],
});

worker.addEventListener('message', async (event) => {
  if (event.data.action !== 'render') {
    return;
  }

  const {x, y, z} = event.data.tile;
  const extent = tileGrid.getTileCoordExtent([x, y, z]);
  map.getView().fit(extent, {
    callback: () => {
      map.once('rendercomplete', (e) => {
        const imageData =
          e.target.renderer_.children_[0]?.childNodes[0].transferToImageBitmap();
        worker.postMessage(
          {
            action: 'rendered',
            imageData: imageData,
            tile: event.data.tile,
          },
          [imageData],
        );
      });
    },
  });
});
