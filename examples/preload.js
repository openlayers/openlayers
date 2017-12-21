import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_BingMaps_ from '../src/ol/source/BingMaps.js';


var view = new _ol_View_({
  center: [-4808600, -2620936],
  zoom: 8
});

var map1 = new Map({
  layers: [
    new TileLayer({
      preload: Infinity,
      source: new _ol_source_BingMaps_({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map1',
  view: view
});

var map2 = new Map({
  layers: [
    new TileLayer({
      preload: 0, // default value
      source: new _ol_source_BingMaps_({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'AerialWithLabels'
      })
    })
  ],
  target: 'map2',
  view: view
});
