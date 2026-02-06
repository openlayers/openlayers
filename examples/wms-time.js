import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {transformExtent} from '../src/ol/proj.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import TileWMS from '../src/ol/source/TileWMS.js';

const interval = 3 * 60 * 60 * 1000;
const step = 15 * 60 * 1000;
const frameRate = 0.5; // frames per second
const extent = transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');

let wmsTime = new Date();
let animationId = null;

const stadiaLayer = new TileLayer({
  source: new StadiaMaps({
    layer: 'stamen_terrain',
  }),
});
const tileWmsLayer = new TileLayer({
  extent: extent,
  source: new TileWMS({
    attributions: ['Iowa State University'],
    url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
    params: {'LAYERS': 'nexrad-n0r-wmst'},
  }),
});

const map = new Map({
  layers: [stadiaLayer, tileWmsLayer],
  target: 'map',
  view: new View({
    center: getCenter(extent),
    zoom: 4,
  }),
});

const el = document.getElementById('info');
function updateInfo(time) {
  el.innerHTML = time.toISOString();
}

function threeHoursAgo() {
  return new Date(Math.floor((Date.now() - interval) / step) * step);
}

function setTime() {
  wmsTime.setMinutes(wmsTime.getMinutes() + 15);
  if (wmsTime.getTime() > Date.now()) {
    wmsTime = threeHoursAgo();
  }
  tileWmsLayer.getSource().updateParams({'TIME': wmsTime.toISOString()});
  updateInfo(wmsTime);
}
setTime();

const stop = function () {
  if (animationId !== null) {
    window.clearInterval(animationId);
    animationId = null;
  }
};

const play = function () {
  stop();
  animationId = window.setInterval(setTime, 1000 / frameRate);
};

const startButton = document.getElementById('play');
startButton.addEventListener('click', play, false);

const stopButton = document.getElementById('pause');
stopButton.addEventListener('click', stop, false);
