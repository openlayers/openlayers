import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ZoomSlider_ from '../src/ol/control/zoomslider';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';


/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {ol.PluggableMap} The ol.Map instance.
 */
var createMap = function(divId) {
  var source, layer, map, zoomslider;

  source = new _ol_source_OSM_();
  layer = new _ol_layer_Tile_({
    source: source
  });
  map = new _ol_Map_({
    layers: [layer],
    target: divId,
    view: new _ol_View_({
      center: [0, 0],
      zoom: 2
    })
  });
  zoomslider = new _ol_control_ZoomSlider_();
  map.addControl(zoomslider);
  return map;
};

var map1 = createMap('map1');
var map2 = createMap('map2');
var map3 = createMap('map3');
