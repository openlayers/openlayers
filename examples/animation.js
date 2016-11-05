goog.require('ol.Map');
goog.require('ol.View');
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

var london = ol.proj.fromLonLat([-0.12755, 51.507222]);
var moscow = ol.proj.fromLonLat([37.6178, 55.7517]);
var istanbul = ol.proj.fromLonLat([28.9744, 41.0128]);
var rome = ol.proj.fromLonLat([12.5, 41.9]);
var bern = ol.proj.fromLonLat([7.4458, 46.95]);

var view = new ol.View({
  center: istanbul,
  zoom: 6
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      preload: 4,
      source: new ol.source.OSM()
    })
  ],
  // Improve user experience by loading tiles while animating. Will make
  // animations stutter on mobile or slow devices.
  loadTilesWhileAnimating: true,
  view: view
});

document.getElementById('rotate-left').addEventListener('click', function() {
  view.animate({
    rotation: view.getRotation() + Math.PI / 2
  });
});

document.getElementById('rotate-right').addEventListener('click', function() {
  view.animate({
    rotation: view.getRotation() - Math.PI / 2
  });
});

document.getElementById('rotate-around-rome').addEventListener('click', function() {
  view.animate({
    rotation: view.getRotation() + 2 * Math.PI,
    rotationAnchor: rome
  });
});

document.getElementById('pan-to-london').addEventListener('click', function() {
  view.animate({
    center: london,
    duration: 2000
  });
});

document.getElementById('elastic-to-moscow').addEventListener('click', function() {
  view.animate({
    center: moscow,
    duration: 2000,
    easing: elastic
  });
});

document.getElementById('bounce-to-istanbul').addEventListener('click', function() {
  view.animate({
    center: istanbul,
    duration: 2000,
    easing: bounce
  });
});

document.getElementById('spin-to-rome').addEventListener('click', function() {
  view.animate({
    center: rome,
    rotation: 2 * Math.PI,
    duration: 2000
  });
});

document.getElementById('fly-to-bern').addEventListener('click', function() {
  var duration = 2000;
  view.animate({
    center: bern,
    duration: duration
  });
  view.animate({
    zoom: view.getZoom() - 0.5,
    duration: duration / 2
  }, {
    zoom: view.getZoom() + 1,
    duration: duration / 2
  });
});
