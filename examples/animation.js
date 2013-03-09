goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.OpenStreetMap');


var london = ol.projection.transform(
    new ol.Coordinate(-0.12755, 51.507222), 'EPSG:4326', 'EPSG:3857');
var moscow = ol.projection.transform(
    new ol.Coordinate(37.6178, 55.7517), 'EPSG:4326', 'EPSG:3857');
var instanbul = ol.projection.transform(
    new ol.Coordinate(28.9744, 41.0128), 'EPSG:4326', 'EPSG:3857');
var rome = ol.projection.transform(
    new ol.Coordinate(12.5, 41.9), 'EPSG:4326', 'EPSG:3857');
var bern = ol.projection.transform(
    new ol.Coordinate(7.4458, 46.95), 'EPSG:4326', 'EPSG:3857');

var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: instanbul,
    zoom: 6
  })
});


var rotateLeft = document.getElementById('rotate-left');
rotateLeft.addEventListener('click', function() {
  var rotateLeft = ol.animation.rotate({
    duration: 2000,
    rotation: -4 * Math.PI
  });
  map.addPreRenderFunction(rotateLeft);
}, false);
var rotateRight = document.getElementById('rotate-right');
rotateRight.addEventListener('click', function() {
  var rotateRight = ol.animation.rotate({
    duration: 2000,
    rotation: 4 * Math.PI
  });
  map.addPreRenderFunction(rotateRight);
}, false);


var panToLondon = document.getElementById('pan-to-london');
panToLondon.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    source: map.getView().getView2D().getCenter()
  });
  map.addPreRenderFunction(pan);
  map.getView().getView2D().setCenter(london);
}, false);

var elasticToMoscow = document.getElementById('elastic-to-moscow');
elasticToMoscow.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.elastic,
    source: map.getView().getView2D().getCenter()
  });
  map.addPreRenderFunction(pan);
  map.getView().getView2D().setCenter(moscow);
}, false);

var bounceToInstanbul = document.getElementById('bounce-to-instanbul');
bounceToInstanbul.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.bounce,
    source: map.getView().getView2D().getCenter()
  });
  map.addPreRenderFunction(pan);
  map.getView().getView2D().setCenter(instanbul);
}, false);

var spinToRome = document.getElementById('spin-to-rome');
spinToRome.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: map.getView().getView2D().getCenter(),
    start: start
  });
  var rotate = ol.animation.rotate({
    duration: duration,
    rotation: 2 * Math.PI,
    start: start
  });
  map.addPreRenderFunctions([pan, rotate]);
  map.getView().getView2D().setCenter(rome);
}, false);

var flyToBern = document.getElementById('fly-to-bern');
flyToBern.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: map.getView().getView2D().getCenter(),
    start: start
  });
  var bounce = ol.animation.bounce({
    duration: duration,
    resolution: 4 * map.getView().getView2D().getResolution(),
    start: start
  });
  map.addPreRenderFunctions([pan, bounce]);
  map.getView().getView2D().setCenter(bern);
}, false);
