import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_BingMaps_ from '../src/ol/source/BingMaps.js';


var view = new _ol_View_({
  center: [-9101767, 2822912],
  zoom: 14
});

var map = new _ol_Map_({
  controls: defaultControls().extend([
    new FullScreen()
  ]),
  layers: [
    new TileLayer({
      source: new _ol_source_BingMaps_({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map',
  view: view
});
