import ImageLayer from '../src/ol/layer/Image.js';
import ImageWMS from '../src/ol/source/ImageWMS.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';

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

const source = new ImageWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  serverType: 'geoserver',
});

source.on('imageloadstart', function () {
  progress.addLoading();
});
source.on(['imageloadend', 'imageloaderror'], function () {
  progress.addLoaded();
});

const map = new Map({
  layers: [new ImageLayer({source: source})],
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
  }),
});

map.on('loadstart', function () {
  progress.show();
});
map.on('loadend', function () {
  progress.hide();
});
