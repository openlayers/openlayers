import BingMaps from '../src/ol/source/BingMaps.js';
import Geolocation from '../src/ol/Geolocation.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const view = new View({
  center: [0, 0],
  zoom: 2,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'AlEoTLTlzFB6Uf4Sy-ugXcRO21skQO7K8eObA5_L-8d20rjqZJLs2nkO1RMjGSPN',
        imagerySet: 'RoadOnDemand',
      }),
    }),
  ],
  target: 'map',
  view: view,
});

const geolocation = new Geolocation({
  projection: view.getProjection(),
  tracking: true,
});
geolocation.once('change:position', function () {
  view.setCenter(geolocation.getPosition());
  view.setResolution(2.388657133911758);
});
