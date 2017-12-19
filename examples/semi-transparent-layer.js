import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_TileJSON_ from '../src/ol/source/TileJSON.js';


var map = new _ol_Map_({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    }),
    new TileLayer({
      source: new _ol_source_TileJSON_({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.json?secure',
        crossOrigin: 'anonymous'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: fromLonLat([-77.93255, 37.9555]),
    zoom: 7
  })
});
