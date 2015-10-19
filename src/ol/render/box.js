// FIXME add rotation

goog.provide('ol.render.Box');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {string} className CSS class name.
 */
ol.render.Box = function(className) {

  /**
   * @type {ol.geom.Polygon}
   * @private
   */
  this.geometry_ = null;

  /**
   * @type {HTMLDivElement}
   * @private
   */
  this.element_ = /** @type {HTMLDivElement} */ (document.createElement('div'));
  this.element_.style.position = 'absolute';
  this.element_.className = 'ol-box ' + className;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.endPixel_ = null;

};
goog.inherits(ol.render.Box, goog.Disposable);


/**
 * @inheritDoc
 */
ol.render.Box.prototype.disposeInternal = function() {
  this.setMap(null);
  goog.base(this, 'disposeInternal');
};


/**
 * @private
 */
ol.render.Box.prototype.render_ = function() {
  var startPixel = this.startPixel_;
  var endPixel = this.endPixel_;
  goog.asserts.assert(startPixel, 'this.startPixel_ must be truthy');
  goog.asserts.assert(endPixel, 'this.endPixel_ must be truthy');
  var px = 'px';
  var style = this.element_.style;
  style.left = Math.min(startPixel[0], endPixel[0]) + px;
  style.top = Math.min(startPixel[1], endPixel[1]) + px;
  style.width = Math.abs(endPixel[0] - startPixel[0]) + px;
  style.height = Math.abs(endPixel[1] - startPixel[1]) + px;
};


/**
 * @param {ol.Map} map Map.
 */
ol.render.Box.prototype.setMap = function(map) {
  if (this.map_) {
    this.map_.getOverlayContainer().removeChild(this.element_);
    var style = this.element_.style;
    style.left = style.top = style.width = style.height = 'inherit';
  }
  this.map_ = map;
  if (this.map_) {
    this.map_.getOverlayContainer().appendChild(this.element_);
  }
};


/**
 * @param {ol.Pixel} startPixel Start pixel.
 * @param {ol.Pixel} endPixel End pixel.
 */
ol.render.Box.prototype.setPixels = function(startPixel, endPixel) {
  this.startPixel_ = startPixel;
  this.endPixel_ = endPixel;
  this.createOrUpdateGeometry();
  this.render_();
};


/**
 * Creates or updates the cached geometry.
 */
ol.render.Box.prototype.createOrUpdateGeometry = function() {
  goog.asserts.assert(this.startPixel_,
      'this.startPixel_ must be truthy');
  goog.asserts.assert(this.endPixel_,
      'this.endPixel_ must be truthy');
  goog.asserts.assert(this.map_, 'this.map_ must be truthy');
  var startPixel = this.startPixel_;
  var endPixel = this.endPixel_;
  var pixels = [
    startPixel,
    [startPixel[0], endPixel[1]],
    endPixel,
    [endPixel[0], startPixel[1]]
  ];
  var coordinates = pixels.map(this.map_.getCoordinateFromPixel, this.map_);
  // close the polygon
  coordinates[4] = coordinates[0].slice();
  if (!this.geometry_) {
    this.geometry_ = new ol.geom.Polygon([coordinates]);
  } else {
    this.geometry_.setCoordinates([coordinates]);
  }
};


/**
 * @return {ol.geom.Polygon} Geometry.
 */
ol.render.Box.prototype.getGeometry = function() {
  return this.geometry_;
};
