import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ZoomSlider from '../src/ol/control/ZoomSlider.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {ol.PluggableMap} The ol.Map instance.
 */
var createMap = function(divId) {
  var source, layer, map, zoomslider;

  source = new _ol_source_OSM_();
  layer = new TileLayer({
    source: source
  });
  map = new Map({
    layers: [layer],
    target: divId,
    view: new View({
      center: [0, 0],
      zoom: 2
    })
  });
  zoomslider = new ZoomSlider();
  map.addControl(zoomslider);
  return map;
};

var map1 = createMap('map1');
var map2 = createMap('map2');
var map3 = createMap('map3');
