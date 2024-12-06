import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OGCMapTile from '../src/ol/source/OGCMapTile.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OGCMapTile({
        url: 'https://maps.gnosis.earth/ogcapi/collections/blueMarble/map/tiles/WorldCRS84Quad',
      }),
    }),
  ],
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 1,
  }),
});
