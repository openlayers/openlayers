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
// Define zoom extent control.
//



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
app.ZoomExtentControl = function(opt_options) {

  var options = opt_options || {};
  this.extent_ = options.extent;

  var anchor = document.createElement('a');
  anchor.href = '#zoom-to';
  anchor.className = 'zoom-to';

  var this_ = this;
  var handleZoomTo = function(e) {
    this_.handleZoomTo(e);
  };

  anchor.addEventListener('click', handleZoomTo, false);
  anchor.addEventListener('touchstart', handleZoomTo, false);

  var element = document.createElement('div');
  element.className = 'zoom-extent ol-unselectable';
  element.appendChild(anchor);

  ol.control.Control.call(this, {
    element: element,
    map: options.map,
    target: options.target
  });

};
ol.inherits(app.ZoomExtentControl, ol.control.Control);


/**
 * @param {Event} e Browser event.
 */
app.ZoomExtentControl.prototype.handleZoomTo = function(e) {
  // prevent #zoomTo anchor from getting appended to the url
  e.preventDefault();

  var map = this.getMap();
  var view = map.getView();
  view.fitExtent(this.extent_, map.getSize());
};


/**
 * Overload setMap to use the view projection's validity extent
 * if no extent was passed to the constructor.
 * @param {ol.Map} map Map.
 */
app.ZoomExtentControl.prototype.setMap = function(map) {
  ol.control.Control.prototype.setMap.call(this, map);
  if (map && !this.extent_) {
    this.extent_ = map.getView().getProjection().getExtent();
  }
};


//
// Create map, giving it a zoom extent control.
//


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new app.ZoomExtentControl({
      extent: [813079.7791264898, 848966.9639063801,
               5929220.284081122, 5936863.986909639]
    })
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
    zoom: 2
  })
});
