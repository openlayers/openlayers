goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');
goog.require('ol.source.TileWMS');

var startDate = new Date(Date.parse('2012-01-01T19:00:00Z'));
var frameRate = 0.5; // frames per second
var animationId = null;

var sources = [
  new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
    url: 'http://oos.soest.hawaii.edu/thredds/wms/hioos/model/wav/ww3/' +
        'WaveWatch_III_Global_Wave_Model_best.ncd?',
    params: {'LAYERS': 'Thgt', 'TIME': startDate.toISOString()}
  })),
  new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
    url: 'http://oos.soest.hawaii.edu/thredds/wms/hioos/model/wav/ww3/' +
        'WaveWatch_III_Global_Wave_Model_best.ncd?',
    params: {'LAYERS': 'Thgt', 'TIME': startDate.toISOString()}
  }))
];
var group = new ol.layer.Group({
  layers: [
    new ol.layer.Tile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: sources[0]
    }),
    new ol.layer.Tile({
      visible: false,
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: sources[1]
    })
  ]
});

var counter = 0;

var switchLayers = function() {
  var bottom = group.getLayers().item(0);
  group.getLayers().removeAt(0);
  group.getLayers().push(bottom);
  group.getLayers().item(0).setVisible(false);
};

for (var i = 0, ii = sources.length; i < ii; ++i) {
  var source = sources[i];
  source.setTileLoadFunction((function() {
    var tileLoadFn = source.getTileLoadFunction();
    return function(tile, src) {
      counter++;
      var image = tile.getImage();
      image.onload = image.onerror = function(event) {
        counter--;
        if (counter === 0) {
          switchLayers();
        }
      };
      tileLoadFn(tile, src);
    };
  })());
}

var layers = [
  new ol.layer.Tile({
    source: new ol.source.MapQuest({layer: 'sat'})
  }),
  group
];
var map = new ol.Map({
  layers: layers,
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});

var setTime = function() {
  startDate.setHours(startDate.getHours() + 1);
  var bottom = /** @type {ol.layer.Tile} */(group.getLayers().item(0));
  bottom.setVisible(true);
  var source = /** @type {ol.source.TileWMS} */(bottom.getSource());
  source.updateParams({'TIME': startDate.toISOString()});
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

var startButton = document.getElementById('start');
startButton.addEventListener('click', function() {
  play();
}, false);

var stopButton = document.getElementById('stop');
stopButton.addEventListener('click', function() {
  stop();
}, false);
