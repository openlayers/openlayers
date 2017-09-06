import _ol_Map_ from '../src/ol/map';
import _ol_Overlay_ from '../src/ol/overlay';
import _ol_View_ from '../src/ol/view';
import _ol_coordinate_ from '../src/ol/coordinate';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';


var layer = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var map = new _ol_Map_({
  layers: [layer],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var pos = _ol_proj_.fromLonLat([16.3725, 48.208889]);

// Vienna marker
var marker = new _ol_Overlay_({
  position: pos,
  positioning: 'center-center',
  element: document.getElementById('marker'),
  stopEvent: false
});
map.addOverlay(marker);

// Vienna label
var vienna = new _ol_Overlay_({
  position: pos,
  element: document.getElementById('vienna')
});
map.addOverlay(vienna);

// Popup showing the position the user clicked
var popup = new _ol_Overlay_({
  element: document.getElementById('popup')
});
map.addOverlay(popup);

map.on('click', function(evt) {
  var element = popup.getElement();
  var coordinate = evt.coordinate;
  var hdms = _ol_coordinate_.toStringHDMS(_ol_proj_.transform(
      coordinate, 'EPSG:3857', 'EPSG:4326'));

  $(element).popover('destroy');
  popup.setPosition(coordinate);
  // the keys are quoted to prevent renaming in ADVANCED mode.
  $(element).popover({
    'placement': 'top',
    'animation': false,
    'html': true,
    'content': '<p>The location you clicked was:</p><code>' + hdms + '</code>'
  });
  $(element).popover('show');
});
