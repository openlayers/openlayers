import _ol_Map_ from '../src/ol/Map.js';
import _ol_Overlay_ from '../src/ol/Overlay.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_coordinate_ from '../src/ol/coordinate.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {toLonLat} from '../src/ol/proj.js';
import _ol_source_TileJSON_ from '../src/ol/source/TileJSON.js';


/**
 * Elements that make up the popup.
 */
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');


/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new _ol_Overlay_({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});


/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


/**
 * Create the map.
 */
var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_TileJSON_({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
        crossOrigin: 'anonymous'
      })
    })
  ],
  overlays: [overlay],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});


/**
 * Add a click handler to the map to render the popup.
 */
map.on('singleclick', function(evt) {
  var coordinate = evt.coordinate;
  var hdms = _ol_coordinate_.toStringHDMS(toLonLat(coordinate));

  content.innerHTML = '<p>You clicked here:</p><code>' + hdms +
      '</code>';
  overlay.setPosition(coordinate);
});
