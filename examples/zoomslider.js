import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {ZoomSlider} from '../src/ol/control.js';

/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {Map} The map instance.
 */
function createMap(divId) {
  const source = new OSM();
  const layer = new TileLayer({
    source: source,
  });
  const map = new Map({
    layers: [layer],
    target: divId,
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });
  const zoomslider = new ZoomSlider();
  map.addControl(zoomslider);
  return map;
}

const map1 = createMap('map1');
const map2 = createMap('map2');
const map3 = createMap('map3');
