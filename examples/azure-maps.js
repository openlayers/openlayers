import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import ImageTile from 'ol/source/ImageTile.js';
import {useGeographic} from 'ol/proj.js';

useGeographic();
const clientSecret = '';

document.getElementById('auth-form').addEventListener('submit', (event) => {
  const clientSecret = event.target.elements['secret'].value;
});

const source = new ImageTile({
  url:
    'https://atlas.microsoft.com/map/tile?subscription-key=' +
    clientSecret +
    '&api-version=2.0&tilesetId=microsoft.imagery&zoom={z}&x={x}&y={y}&tileSize=256&language=EN',
});

const map = new Map({
  layers: [new TileLayer({source})],
  target: 'map',
  view: new View({
    center: [1, 45],
    //   zoom: 10,
    //    maxZoom: 13,
  }),
});