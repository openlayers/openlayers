goog.require('ol');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.Control');
goog.require('ol.control.Pan');
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
    e.preventDefault();
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

var pan = new ol.control.Pan({
  html:
      '<div class="ol-svg-pan">' +
      '  <svg' +
      '     xmlns="http://www.w3.org/2000/svg"' +
      '     version="1.1">' +
      '    <path' +
      '       d="m 32,16 a 16,16 0 0 1 -32,0 16,16 0 1 1 32,0 z"' +
      '       class="ol-svg-button-border" />' +
      '    <a class="ol-svg-button" id="north">' +
      '      <path' +
      '         d="M 16,3 C 12.588402,3 9.5378673,4.3815351 7.2187501,6.53125' +
      '            L 16,15.28125 l 8.78125,-8.75' +
      '            C 22.462133,4.3815351 19.411598,3 16,3 z"' +
      '         class="ol-svg-button-background" />' +
      '      <path' +
      '         d="m 15.957513,4.352591 4.4664,4.724627 -8.929919,-0.0019 z"' +
      '         class="ol-svg-button-forground" />' +
      '    </a>' +
      '    <a class="ol-svg-button" id="south">' +
      '      <path' +
      '         d="M 24.78125,25.46875 16,16.71875 l -8.7812499,8.75' +
      '            C 9.5378673,27.618465 12.588402,29 16,29 ' +
      '            c 3.411598,0 6.462133,-1.381535 8.78125,-3.53125 z"' +
      '         class="ol-svg-button-background" />' +
      '      <path' +
      '         d="m 16.039606,27.647409 4.4664,-4.724628 -8.929919,0.0019 z"' +
      '         class="ol-svg-button-forground" />' +
      '    </a>' +
      '    <a class="ol-svg-button" id="west">' +
      '      <path' +
      '         d="M 6.5312501,24.78125 15.28125,16 6.5312501,7.21875' +
      '            C 4.381535,9.537867 3,12.588402 3.0000001,16' +
      '            c 0,3.411598 1.3815349,6.462133 3.53125,8.78125 z"' +
      '         class="ol-svg-button-background" />' +
      '      <path' +
      '         d="m 4.3525911,16.039606 4.7246274,4.4664 -0.00194,-8.929919 ' +
      'z"' +
      '         class="ol-svg-button-forground" />' +
      '    </a>' +
      '    <a class="ol-svg-button" id="east">' +
      '      <path' +
      '         d="m 25.46875,7.21875 -8.75,8.78125 8.75,8.78125' +
      '            C 27.618465,22.462133 29,19.411598 29,16 29,12.588402' +
      '            27.618465,9.537867 25.46875,7.21875 z"' +
      '         class="ol-svg-button-background" />' +
      '      <path' +
      '         d="m 27.647409,15.957513 -4.724627,4.4664 0.0019,-8.929919 z"' +
      '         class="ol-svg-button-forground" />' +
      '    </a>' +
      '  </svg>' +
      '</div>'
});

//
// Create map, giving it a rotate to north control and the pan control.
//

var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new app.RotateNorthControl(), pan
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
