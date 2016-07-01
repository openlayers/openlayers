goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.TileWMS');

var startDate = new Date(Date.parse('2012-01-01T19:00:00Z'));
var frameRate = 0.5; // frames per second
var animationId = null;

var layers = [
  new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  new ol.layer.Tile({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
      url: 'http://oos.soest.hawaii.edu/thredds/wms/hioos/model/wav/ww3/' +
          'WaveWatch_III_Global_Wave_Model_best.ncd?',
      params: {'LAYERS': 'Thgt', 'TIME': startDate.toISOString()}
    }))
  })
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});

var updateInfo = function() {
  var el = document.getElementById('info');
  el.innerHTML = startDate.toISOString();
};

var setTime = function() {
  startDate.setHours(startDate.getHours() + 1);
  layers[1].getSource().updateParams({'TIME': startDate.toISOString()});
  updateInfo();
};

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
