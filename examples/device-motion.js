goog.require('ol.DeviceMotion');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');

var map = new ol.Map({
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
var view = map.getView();

var deviceMotion = new ol.DeviceMotion();
var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', deviceMotion, 'tracking');

deviceMotion.on('change', function(event) {
  var accel = event.target.getAccelerationIncludingGravity();
  if (accel) {
    $('#accel-x').html(accel.x + ' [m/s<sup>2</sup>]');
    $('#accel-y').html(accel.y + ' [m/s<sup>2</sup>]');
    $('#accel-z').html(accel.z + ' [m/s<sup>2</sup>]');
  }

  $('#rotation-alpha').html(deviceMotion.getAlphaRate() + ' [radian/s]');
  $('#rotation-beta').html(deviceMotion.getBetaRate() + ' [radian/s]');
  $('#rotation-gamma').html(deviceMotion.getGammaRate() + ' [radian/s]');

});
