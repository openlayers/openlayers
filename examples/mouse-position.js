import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import MousePosition from '../src/ol/control/MousePosition.js';
import _ol_coordinate_ from '../src/ol/coordinate.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var mousePositionControl = new MousePosition({
  coordinateFormat: _ol_coordinate_.createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var map = new _ol_Map_({
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }).extend([mousePositionControl]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var projectionSelect = document.getElementById('projection');
projectionSelect.addEventListener('change', function(event) {
  mousePositionControl.setProjection(event.target.value);
});

var precisionInput = document.getElementById('precision');
precisionInput.addEventListener('change', function(event) {
  var format = _ol_coordinate_.createStringXY(event.target.valueAsNumber);
  mousePositionControl.setCoordinateFormat(format);
});
