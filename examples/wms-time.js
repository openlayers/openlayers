import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {transformExtent} from '../src/ol/proj.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';

function threeHoursAgo() {
  return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * 3);
}

var extent = transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
var startDate = threeHoursAgo();
var frameRate = 0.5; // frames per second
var animationId = null;

var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_Stamen_({
      layer: 'terrain'
    })
  }),
  new _ol_layer_Tile_({
    extent: extent,
    source: new _ol_source_TileWMS_({
      attributions: ['Iowa State University'],
      url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
      params: {'LAYERS': 'nexrad-n0r-wmst'}
    })
  })
];
var map = new _ol_Map_({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: _ol_extent_.getCenter(extent),
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
