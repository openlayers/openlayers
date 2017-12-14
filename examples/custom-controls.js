import {inherits} from '../src/ol/index.js';
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_control_ from '../src/ol/control.js';
import Control from '../src/ol/control/Control.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


/**
 * Define a namespace for the application.
 */
window.app = {};
var app = window.app;


//
// Define rotate to north control.
//


/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
app.RotateNorthControl = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = 'N';

  var this_ = this;
  var handleRotateNorth = function() {
    this_.getMap().getView().setRotation(0);
  };

  button.addEventListener('click', handleRotateNorth, false);
  button.addEventListener('touchstart', handleRotateNorth, false);

  var element = document.createElement('div');
  element.className = 'rotate-north ol-unselectable ol-control';
  element.appendChild(button);

  Control.call(this, {
    element: element,
    target: options.target
  });

};
inherits(app.RotateNorthControl, Control);


//
// Create map, giving it a rotate to north control.
//


var map = new _ol_Map_({
  controls: _ol_control_.defaults({
    attributionOptions: {
      collapsible: false
    }
  }).extend([
    new app.RotateNorthControl()
  ]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 3,
    rotation: 1
  })
});
