import Map from '../src/ol/Map.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {transformExtent} from '../src/ol/proj.js';

function transform(extent) {
  return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

const extents = {
  India: transform([68.17665, 7.96553, 97.40256, 35.49401]),
  Argentina: transform([-73.41544, -55.25, -53.62835, -21.83231]),
  Nigeria: transform([2.6917, 4.24059, 14.57718, 13.86592]),
  Sweden: transform([11.02737, 55.36174, 23.90338, 69.10625]),
};

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const base = new TileLayer({
  source: new TileJSON({
    url:
      'https://api.tiles.mapbox.com/v4/mapbox.world-light.json?secure&access_token=' +
      key,
    crossOrigin: 'anonymous',
  }),
});

const overlay = new TileLayer({
  extent: extents.India,
  source: new TileJSON({
    url:
      'https://api.tiles.mapbox.com/v4/mapbox.world-black.json?secure&access_token=' +
      key,
    crossOrigin: 'anonymous',
  }),
});

const map = new Map({
  layers: [base, overlay],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

for (const key in extents) {
  document.getElementById(key).onclick = function (event) {
    overlay.setExtent(extents[event.target.id]);
  };
}
