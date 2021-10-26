import Map from '../src/ol/Map.js';
import OGCMapTile from '../src/ol/source/OGCMapTile.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OGCMapTile({
        url: 'https://maps.ecere.com/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad',
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
