/**
 * @module ol/render/Box
 */
// FIXME add rotation

import {inherits} from '../util.js';
import Disposable from '../Disposable.js';
import Polygon from '../geom/Polygon.js';

/**
 * @constructor
 * @extends {module:ol/Disposable}
 * @param {string} className CSS class name.
 */
const RenderBox = function(className) {

  /**
   * @type {module:ol/geom/Polygon}
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
   * @type {module:ol/PluggableMap}
   */
  this.map_ = null;

  /**
   * @private
   * @type {module:ol~Pixel}
   */
  this.startPixel_ = null;

  /**
   * @private
   * @type {module:ol~Pixel}
   */
  this.endPixel_ = null;

};

inherits(RenderBox, Disposable);


/**
 * @inheritDoc
 */
RenderBox.prototype.disposeInternal = function() {
  this.setMap(null);
};


/**
 * @private
 */
RenderBox.prototype.render_ = function() {
  const startPixel = this.startPixel_;
  const endPixel = this.endPixel_;
  const px = 'px';
  const style = this.element_.style;
  style.left = Math.min(startPixel[0], endPixel[0]) + px;
  style.top = Math.min(startPixel[1], endPixel[1]) + px;
  style.width = Math.abs(endPixel[0] - startPixel[0]) + px;
  style.height = Math.abs(endPixel[1] - startPixel[1]) + px;
};


/**
 * @param {module:ol/PluggableMap} map Map.
 */
RenderBox.prototype.setMap = function(map) {
  if (this.map_) {
    this.map_.getOverlayContainer().removeChild(this.element_);
    const style = this.element_.style;
    style.left = style.top = style.width = style.height = 'inherit';
  }
  this.map_ = map;
  if (this.map_) {
    this.map_.getOverlayContainer().appendChild(this.element_);
  }
};


/**
 * @param {module:ol~Pixel} startPixel Start pixel.
 * @param {module:ol~Pixel} endPixel End pixel.
 */
RenderBox.prototype.setPixels = function(startPixel, endPixel) {
  this.startPixel_ = startPixel;
  this.endPixel_ = endPixel;
  this.createOrUpdateGeometry();
  this.render_();
};


/**
 * Creates or updates the cached geometry.
 */
RenderBox.prototype.createOrUpdateGeometry = function() {
  const startPixel = this.startPixel_;
  const endPixel = this.endPixel_;
  const pixels = [
    startPixel,
    [startPixel[0], endPixel[1]],
    endPixel,
    [endPixel[0], startPixel[1]]
  ];
  const coordinates = pixels.map(this.map_.getCoordinateFromPixel, this.map_);
  // close the polygon
  coordinates[4] = coordinates[0].slice();
  if (!this.geometry_) {
    this.geometry_ = new Polygon([coordinates]);
  } else {
    this.geometry_.setCoordinates([coordinates]);
  }
};


/**
 * @return {module:ol/geom/Polygon} Geometry.
 */
RenderBox.prototype.getGeometry = function() {
  return this.geometry_;
};
export default RenderBox;
