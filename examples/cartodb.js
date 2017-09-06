import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_CartoDB_ from '../src/ol/source/cartodb';
import _ol_source_OSM_ from '../src/ol/source/osm';

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

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Tile_({
      source: cartoDBSource
    })
  ],
  target: 'map',
  view: new _ol_View_({
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
