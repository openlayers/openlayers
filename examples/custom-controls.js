goog.require('ol');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.Control');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


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

  var anchor = document.createElement('a');
  anchor.href = '#rotate-north';
  anchor.innerHTML = 'N';

  var this_ = this;
  var handleRotateNorth = function(e) {
    // prevent #rotate-north anchor from getting appended to the url
    this_.getMap().getView().getView2D().setRotation(0);
  };

  anchor.addEventListener('click', handleRotateNorth, false);
  anchor.addEventListener('touchstart', handleRotateNorth, false);

  var element = document.createElement('div');
  element.className = 'rotate-north ol-unselectable';
  element.appendChild(anchor);

  ol.control.Control.call(this, {
    element: element,
    map: options.map,
    target: options.target
  });

};
ol.inherits(app.RotateNorthControl, ol.control.Control);


//
// Create map, giving it a rotate to north control.
//


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new app.RotateNorthControl()
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2,
    rotation: 1
  })
});
