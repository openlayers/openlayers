import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_CartoDB_ from '../src/ol/source/CartoDB.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var mapConfig = {
  'layers': [{
    'type': 'cartodb',
    'options': {
      'cartocss_version': '2.1.1',
      'cartocss': '#layer { polygon-fill: #F00; }',
      'sql': 'select * from european_countries_e where area > 0'
    }
  }]
};

var cartoDBSource = new _ol_source_CartoDB_({
  account: 'documentation',
  config: mapConfig
});

var map = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    }),
    new TileLayer({
      source: cartoDBSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

function setArea(n) {
  mapConfig.layers[0].options.sql =
      'select * from european_countries_e where area > ' + n;
  cartoDBSource.setConfig(mapConfig);
}


document.getElementById('country-area').addEventListener('change', function() {
  setArea(this.value);
});
