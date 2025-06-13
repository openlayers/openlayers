import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import {useGeographic} from 'ol/proj.js';
import ImageTile from 'ol/source/ImageTile.js';

useGeographic();

const azureLayer = new TileLayer();

document.getElementById('auth-form').addEventListener('submit', (event) => {
  const clientSecret = event.target.elements['secret'].value;
  azureLayer.setSource(
    new ImageTile({
      url:
        'https://atlas.microsoft.com/map/tile?subscription-key=' +
        clientSecret +
        '&api-version=2.0&tilesetId=microsoft.imagery&zoom={z}&x={x}&y={y}&tileSize=256&language=EN',
      crossOrigin: 'anonymous',
    }),
  );
});

const map = new Map({
  layers: [azureLayer],
  target: 'map',
  view: new View({
    center: [1, 45],
    zoom: 12,
  }),
});