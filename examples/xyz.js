import ImageTile from '../src/ol/source/ImageTile.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new ImageTile({
        url:
          'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
          '?apikey=0e6fc415256d4fbb9b5166a718591d71',
      }),
    }),
  ],
  view: new View({
    center: [-472202, 7530279],
    zoom: 12,
  }),
});
