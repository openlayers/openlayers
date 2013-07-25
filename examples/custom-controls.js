goog.require('ol');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.ZoomToExtent');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.source.OSM');



var RotateNorthControl = function(element) {
  this.element = $(element);
};


/**
 * @param {ol.Map} map Map.
 */
RotateNorthControl.prototype.setMap = function(map) {
  if (map) {
    var element = this.element;
    var view = map.getView().getView2D();
    element.on('click', function() {
      view.setRotation(0);
    });
    view.on('change:rotation', function() {
      element.prop('disabled', view.getRotation() == 0);
    });
    // FIXME: force a rotation change to initalize the control
    view.setRotation(view.getRotation());
  }
};


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new RotateNorthControl('#rotate-north'),
    new ol.control.ZoomToExtent()
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

// Handle recenter on click for all html element with a 'data-recenter'
// attribute. Example:
//   <a data-proj="EPSG:4326" data-recenter="-0.12755,51.507222">...</a>
// On link click, recenters the map to '-0.12755,51.507222'
// (London in EPSG:4326), if 'data-proj' is not missing, uses the map's
// projection.
$(document).on('click', '[data-recenter]', function(event) {
  var recenter = $.map($(this).data('recenter').split(','), parseFloat);
  var proj = ol.proj.get($(this).data('proj'));
  var view = map.getView().getView2D();
  if (proj) {
    recenter = ol.proj.transform(recenter, proj, view.getProjection());
  }
  if (recenter.length === 2) {
    // a point
    view.setCenter(recenter);
  } else if (recenter.length === 4) {
    // an extent
    view.fitExtent(recenter, map.getSize());
  }
});
