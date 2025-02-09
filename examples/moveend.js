import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getBottomLeft, getTopRight} from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {toLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

/**
 * @param {string} id Input element id
 * @param {number} value Value to set
 */
function display(id, value) {
  const input = /** @type {HTMLInputElement} */ (document.getElementById(id));
  input.value = value.toFixed(2);
}

/**
 * @param {number} value Longitude
 * @return {number} Longitude in range -180, 180
 */
function wrapLon(value) {
  const worlds = Math.floor((value + 180) / 360);
  return value - worlds * 360;
}

map.on('moveend', function (evt) {
  const map = evt.map;
  const extent = map.getView().calculateExtent(map.getSize());
  const bottomLeft = toLonLat(getBottomLeft(extent));
  const topRight = toLonLat(getTopRight(extent));
  display('left', wrapLon(bottomLeft[0]));
  display('bottom', bottomLeft[1]);
  display('right', wrapLon(topRight[0]));
  display('top', topRight[1]);
});
