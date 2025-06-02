import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import CartoDB from '../src/ol/source/CartoDB.js';
import OSM from '../src/ol/source/OSM.js';

const mapConfig = {
  'layers': [
    {
      'type': 'cartodb',
      'options': {
        'cartocss_version': '2.1.1',
        'cartocss': '#layer { polygon-fill: #F00; }',
      },
    },
  ],
};

function setArea(n) {
  mapConfig.layers[0].options.sql =
    'select * from european_countries_e where area > ' + n;
}
const areaSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('country-area')
);
setArea(areaSelect.value);

const cartoDBSource = new CartoDB({
  account: 'documentation',
  config: mapConfig,
});

areaSelect.addEventListener('change', function () {
  setArea(this.value);
  cartoDBSource.setConfig(mapConfig);
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      source: cartoDBSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [8500000, 8500000],
    zoom: 2,
  }),
});
