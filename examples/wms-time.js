goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.Stamen');
goog.require('ol.source.TileWMS');

function threeHoursAgo() {
  return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * 3);
}

var extent = ol.proj.transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
var startDate = threeHoursAgo();
var frameRate = 0.5; // frames per second
var animationId = null;

var layers = [
  new ol.layer.Tile({
    source: new ol.source.Stamen({
      layer: 'terrain'
    })
  }),
  new ol.layer.Tile({
    extent: extent,
    source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
      attributions: ['Iowa State University'],
      url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
      params: {'LAYERS': 'nexrad-n0r-wmst'}
    }))
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: ol.extent.getCenter(extent),
    zoom: 4
  })
});

function updateInfo() {
  var el = document.getElementById('info');
  el.innerHTML = startDate.toISOString();
}

function setTime() {
  startDate.setMinutes(startDate.getMinutes() + 15);
  if (startDate > Date.now()) {
    startDate = threeHoursAgo();
  }
  layers[1].getSource().updateParams({'TIME': startDate.toISOString()});
  updateInfo();
}
setTime();

var stop = function() {
  if (animationId !== null) {
    window.clearInterval(animationId);
    animationId = null;
  }
};

var play = function() {
  stop();
  animationId = window.setInterval(setTime, 1000 / frameRate);
};

var startButton = document.getElementById('play');
startButton.addEventListener('click', play, false);

var stopButton = document.getElementById('pause');
stopButton.addEventListener('click', stop, false);

updateInfo();
