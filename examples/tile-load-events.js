import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

/**
 * Renders a progress bar.
 * @param {HTMLElement} el The target element.
 * @class
 */
function Progress(el) {
  this.el = el;
  this.loading = 0;
  this.loaded = 0;
}

/**
 * Increment the count of loading tiles.
 */
Progress.prototype.addLoading = function () {
  ++this.loading;
  this.update();
};

/**
 * Increment the count of loaded tiles.
 */
Progress.prototype.addLoaded = function () {
  ++this.loaded;
  this.update();
};

/**
 * Update the progress bar.
 */
Progress.prototype.update = function () {
  const width = ((this.loaded / this.loading) * 100).toFixed(1) + '%';
  this.el.style.width = width;
};

/**
 * Show the progress bar.
 */
Progress.prototype.show = function () {
  this.el.style.visibility = 'visible';
};

/**
 * Hide the progress bar.
 */
Progress.prototype.hide = function () {
  const style = this.el.style;
  setTimeout(function () {
    style.visibility = 'hidden';
    style.width = 0;
  }, 250);
};

const progress = new Progress(document.getElementById('progress'));

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const source = new XYZ({
  attributions: attributions,
  url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=' + key,
  tileSize: 512,
});

source.on('tileloadstart', function () {
  progress.addLoading();
});
source.on(['tileloadend', 'tileloaderror'], function () {
  progress.addLoaded();
});

const map = new Map({
  layers: [new TileLayer({source: source})],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

map.on('loadstart', function () {
  progress.show();
});
map.on('loadend', function () {
  progress.hide();
});
