goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.OSM');


var london = ol.projection.transform(
    [-0.12755, 51.507222], 'EPSG:4326', 'EPSG:3857');
var moscow = ol.projection.transform(
    [37.6178, 55.7517], 'EPSG:4326', 'EPSG:3857');
var istanbul = ol.projection.transform(
    [28.9744, 41.0128], 'EPSG:4326', 'EPSG:3857');
var rome = ol.projection.transform(
    [12.5, 41.9], 'EPSG:4326', 'EPSG:3857');
var bern = ol.projection.transform(
    [7.4458, 46.95], 'EPSG:4326', 'EPSG:3857');
var madrid = ol.projection.transform(
    [-3.683333, 40.4], 'EPSG:4326', 'EPSG:3857');

var view = new ol.View2D({
  // the view's initial state
  center: istanbul,
  zoom: 6
});

var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      preload: 4,
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: view
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
    source: view.getCenter()
  });
  map.addPreRenderFunction(pan);
  view.setCenter(london);
}, false);

var elasticToMoscow = document.getElementById('elastic-to-moscow');
elasticToMoscow.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.elastic,
    source: view.getCenter()
  });
  map.addPreRenderFunction(pan);
  view.setCenter(moscow);
}, false);

var bounceToIstanbul = document.getElementById('bounce-to-istanbul');
bounceToIstanbul.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.bounce,
    source: view.getCenter()
  });
  map.addPreRenderFunction(pan);
  view.setCenter(istanbul);
}, false);

var spinToRome = document.getElementById('spin-to-rome');
spinToRome.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: view.getCenter(),
    start: start
  });
  var rotate = ol.animation.rotate({
    duration: duration,
    rotation: 2 * Math.PI,
    start: start
  });
  map.addPreRenderFunctions([pan, rotate]);
  view.setCenter(rome);
}, false);

var flyToBern = document.getElementById('fly-to-bern');
flyToBern.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: view.getCenter(),
    start: start
  });
  var bounce = ol.animation.bounce({
    duration: duration,
    resolution: 4 * view.getResolution(),
    start: start
  });
  map.addPreRenderFunctions([pan, bounce]);
  view.setCenter(bern);
}, false);

var spiralToMadrid = document.getElementById('spiral-to-madrid');
spiralToMadrid.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: view.getCenter(),
    start: start
  });
  var bounce = ol.animation.bounce({
    duration: duration,
    resolution: 2 * view.getResolution(),
    start: start
  });
  var rotate = ol.animation.rotate({
    duration: duration,
    rotation: -4 * Math.PI,
    start: start
  });
  map.addPreRenderFunctions([pan, bounce, rotate]);
  view.setCenter(madrid);
}, false);
