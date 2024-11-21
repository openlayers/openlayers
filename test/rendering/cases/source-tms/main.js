import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import {ImageTile, TileDebug} from '../../../../src/ol/source.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new ImageTile({
        url: '/data/tiles/nyc/{z}/{x}/{-y}.jpg',
        transition: 0,
      }),
    }),
    new TileLayer({
      source: new TileDebug({
        template: 'z:{z} x:{x} y:{-y}',
      }),
    }),
  ],
  view: new View({
    center: fromLonLat([-73.9985, 40.71]),
    zoom: 15.1,
  }),
});

render();
