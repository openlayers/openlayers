goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.source.ImageWMS');


/**
 * Renders a progress bar.
 * @param {Element} el The target element.
 * @constructor
 */
function Progress(el) {
  this.el = el;
  this.loading = 0;
  this.loaded = 0;
}


/**
 * Increment the count of loading tiles.
 */
Progress.prototype.addLoading = function() {
  if (this.loading === 0) {
    this.show();
  }
  ++this.loading;
  this.update();
};


/**
 * Increment the count of loaded tiles.
 */
Progress.prototype.addLoaded = function() {
  var this_ = this;
  setTimeout(function() {
    ++this_.loaded;
    this_.update();
  }, 100);
};


/**
 * Update the progress bar.
 */
Progress.prototype.update = function() {
  var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
  this.el.style.width = width;
  if (this.loading === this.loaded) {
    this.loading = 0;
    this.loaded = 0;
    var this_ = this;
    setTimeout(function() {
      this_.hide();
    }, 500);
  }
};


/**
 * Show the progress bar.
 */
Progress.prototype.show = function() {
  this.el.style.visibility = 'visible';
};


/**
 * Hide the progress bar.
 */
Progress.prototype.hide = function() {
  if (this.loading === this.loaded) {
    this.el.style.visibility = 'hidden';
    this.el.style.width = 0;
  }
};

var progress = new Progress(document.getElementById('progress'));

var source = new ol.source.ImageWMS({
  url: 'http://demo.boundlessgeo.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  serverType: 'geoserver'
});

source.on('imageloadstart', function() {
  progress.addLoading();
});

source.on('imageloadend', function() {
  progress.addLoaded();
});
source.on('imageloaderror', function() {
  progress.addLoaded();
});

var map = new ol.Map({
  logo: false,
  layers: [
    new ol.layer.Image({source: source})
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
