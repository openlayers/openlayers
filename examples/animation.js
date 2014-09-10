goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.animation');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');


// from https://github.com/DmitryBaranovskiy/raphael
function bounce(t) {
  var s = 7.5625, p = 2.75, l;
  if (t < (1 / p)) {
    l = s * t * t;
  } else {
    if (t < (2 / p)) {
      t -= (1.5 / p);
      l = s * t * t + 0.75;
    } else {
      if (t < (2.5 / p)) {
        t -= (2.25 / p);
        l = s * t * t + 0.9375;
      } else {
        t -= (2.625 / p);
        l = s * t * t + 0.984375;
      }
    }
  }
  return l;
}

// from https://github.com/DmitryBaranovskiy/raphael
function elastic(t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

var london = ol.proj.transform([-0.12755, 51.507222], 'EPSG:4326', 'EPSG:3857');
var moscow = ol.proj.transform([37.6178, 55.7517], 'EPSG:4326', 'EPSG:3857');
var istanbul = ol.proj.transform([28.9744, 41.0128], 'EPSG:4326', 'EPSG:3857');
var rome = ol.proj.transform([12.5, 41.9], 'EPSG:4326', 'EPSG:3857');
var bern = ol.proj.transform([7.4458, 46.95], 'EPSG:4326', 'EPSG:3857');
var madrid = ol.proj.transform([-3.683333, 40.4], 'EPSG:4326', 'EPSG:3857');

var view = new ol.View({
  // the view's initial state
  center: istanbul,
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
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
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

var rotateAroundRome = document.getElementById('rotate-around-rome');
rotateAroundRome.addEventListener('click', function() {
  var currentRotation = view.getRotation();
  var rotateAroundRome = ol.animation.rotate({
    anchor: rome,
    duration: 1000,
    rotation: currentRotation
  });
  map.beforeRender(rotateAroundRome);
  view.rotate(currentRotation + (Math.PI / 2), rome);
}, false);

var panToLondon = document.getElementById('pan-to-london');
panToLondon.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenter(london);
}, false);

var elasticToMoscow = document.getElementById('elastic-to-moscow');
elasticToMoscow.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: elastic,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenter(moscow);
}, false);

var bounceToIstanbul = document.getElementById('bounce-to-istanbul');
bounceToIstanbul.addEventListener('click', function() {
  var pan = ol.animation.pan({
    duration: 2000,
    easing: bounce,
    source: /** @type {ol.Coordinate} */ (view.getCenter())
  });
  map.beforeRender(pan);
  view.setCenter(istanbul);
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
  view.setCenter(rome);
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
  view.setCenter(bern);
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
  view.setCenter(madrid);
}, false);
