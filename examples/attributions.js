import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import Attribution from '../src/ol/control/Attribution.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var attribution = new Attribution({
  collapsible: false
});
var map = new _ol_Map_({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    })
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

function checkSize() {
  var small = map.getSize()[0] < 600;
  attribution.setCollapsible(small);
  attribution.setCollapsed(small);
}

window.addEventListener('resize', checkSize);
checkSize();
