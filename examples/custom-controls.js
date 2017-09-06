import _ol_ from '../src/ol';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_control_Control_ from '../src/ol/control/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';


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

  _ol_control_Control_.call(this, {
    element: element,
    target: options.target
  });

};
_ol_.inherits(app.RotateNorthControl, _ol_control_Control_);


//
// Create map, giving it a rotate to north control.
//


var map = new _ol_Map_({
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
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
