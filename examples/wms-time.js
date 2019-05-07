import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {transformExtent} from '../src/ol/proj.js';
import Stamen from '../src/ol/source/Stamen.js';
import TileWMS from '../src/ol/source/TileWMS.js';

function threeHoursAgo() {
  return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * 3);
}

const extent = transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
let startDate = threeHoursAgo();
const frameRate = 0.5; // frames per second
let animationId = null;

const layers = [
  new TileLayer({
    source: new Stamen({
      layer: 'terrain'
    })
  }),
  new TileLayer({
    extent: extent,
    source: new TileWMS({
      attributions: ['Iowa State University'],
      url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
      params: {'LAYERS': 'nexrad-n0r-wmst'}
    })
  })
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: getCenter(extent),
    zoom: 4
  })
});

function updateInfo() {
  const el = document.getElementById('info');
  el.innerHTML = startDate.toISOString();
}

function setTime() {
  startDate.setMinutes(startDate.getMinutes() + 15);
  if (startDate > new Date()) {
    startDate = threeHoursAgo();
  }
  layers[1].getSource().updateParams({'TIME': startDate.toISOString()});
  updateInfo();
}
setTime();

const stop = function() {
  if (animationId !== null) {
    window.clearInterval(animationId);
    animationId = null;
  }
};

const play = function() {
  stop();
  animationId = window.setInterval(setTime, 1000 / frameRate);
};

const startButton = document.getElementById('play');
startButton.addEventListener('click', play, false);

const stopButton = document.getElementById('pause');
stopButton.addEventListener('click', stop, false);

updateInfo();
