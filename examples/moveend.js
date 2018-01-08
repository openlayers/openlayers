import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {toLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';


var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

function display(id, value) {
  document.getElementById(id).value = value.toFixed(2);
}

function wrapLon(value) {
  var worlds = Math.floor((value + 180) / 360);
  return value - (worlds * 360);
}

function onMoveEnd(evt) {
  var map = evt.map;
  var extent = map.getView().calculateExtent(map.getSize());
  var bottomLeft = toLonLat(_ol_extent_.getBottomLeft(extent));
  var topRight = toLonLat(_ol_extent_.getTopRight(extent));
  display('left', wrapLon(bottomLeft[0]));
  display('bottom', bottomLeft[1]);
  display('right', wrapLon(topRight[0]));
  display('top', topRight[1]);
}

map.on('moveend', onMoveEnd);
