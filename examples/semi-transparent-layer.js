import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Tile_({
      source: new _ol_source_TileJSON_({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.json?secure',
        crossOrigin: 'anonymous'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([-77.93255, 37.9555]),
    zoom: 7
  })
});
