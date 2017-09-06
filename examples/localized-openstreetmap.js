import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';


var openCycleMapLayer = new _ol_layer_Tile_({
  source: new _ol_source_OSM_({
    attributions: [
      'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
      _ol_source_OSM_.ATTRIBUTION
    ],
    url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
        '?apikey=0e6fc415256d4fbb9b5166a718591d71'
  })
});

var openSeaMapLayer = new _ol_layer_Tile_({
  source: new _ol_source_OSM_({
    attributions: [
      'All maps © <a href="http://www.openseamap.org/">OpenSeaMap</a>',
      _ol_source_OSM_.ATTRIBUTION
    ],
    opaque: false,
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
  })
});


var map = new _ol_Map_({
  layers: [
    openCycleMapLayer,
    openSeaMapLayer
  ],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
    maxZoom: 18,
    center: [-244780.24508882355, 5986452.183179816],
    zoom: 15
  })
});
