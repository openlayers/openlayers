goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.animation');
goog.require('ol.easing');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


// LatLng coordinates
var london = [51.507222, -0.12755];
var moscow = [55.7517, 37.6178];
var istanbul = [41.0128, 28.9744];
var rome = [41.9, 12.5];
var bern = [46.95, 7.4458];
var madrid = [40.4, -3.683333];

var view = new ol.View2D({
  // the view's initial state
  centerLatLng: istanbul,
  zoom: 6
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 4,
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: view
});

var rotateLeft = document.getElementById('rotate-left');
rotateLeft.addEventListener('click', function() {
  var rotateLeft = ol.animation.rotate({
    duration: 2000,
    rotation: -4 * Math.PI
  });
  map.beforeRender(rotateLeft);
}, false);
var rotateRight = document.getElementById('rotate-right');
rotateRight.addEventListener('click', function() {
  var rotateRight = ol.animation.rotate({
    duration: 2000,
    rotation: 4 * Math.PI
  });
  map.beforeRender(rotateRight);
}, false);


var panToLondon = document.getElementById('pan-to-london');
panToLondon.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenterLatLng(london);
}, false);

var elasticToMoscow = document.getElementById('elastic-to-moscow');
elasticToMoscow.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.elastic,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenterLatLng(moscow);
}, false);

var bounceToIstanbul = document.getElementById('bounce-to-istanbul');
bounceToIstanbul.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: ol.easing.bounce,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenterLatLng(istanbul);
}, false);

var spinToRome = document.getElementById('spin-to-rome');
spinToRome.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: /** @type {ol.Coordinate} */ (view.getCenter()),
    start: start
  });
  var rotate = ol.animation.rotate({
    duration: duration,
    rotation: 2 * Math.PI,
    start: start
  });
  map.beforeRender(pan, rotate);
  view.setCenterLatLng(rome);
}, false);

var flyToBern = document.getElementById('fly-to-bern');
flyToBern.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: /** @type {ol.Coordinate} */ (view.getCenter()),
    start: start
  });
  var bounce = ol.animation.bounce({
    duration: duration,
    resolution: 4 * view.getResolution(),
    start: start
  });
  map.beforeRender(pan, bounce);
  view.setCenterLatLng(bern);
}, false);

var spiralToMadrid = document.getElementById('spiral-to-madrid');
spiralToMadrid.addEventListener('click', function() {
  var duration = 2000;
  var start = +new Date();
  var pan = ol.animation.pan({
    duration: duration,
    source: /** @type {ol.Coordinate} */ (view.getCenter()),
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
  map.beforeRender(pan, bounce, rotate);
  view.setCenterLatLng(madrid);
}, false);
