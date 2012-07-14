goog.provide('ol.Camera');
goog.provide('ol.CameraProperty');

goog.require('goog.math.Coordinate');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.CameraProperty = {
  POSITION: 'center',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};



/**
 * @constructor
 * @extends {ol.Object}
 */
ol.Camera = function() {

  goog.base(this);

};
goog.inherits(ol.Camera, ol.Object);


/**
 * @return {goog.math.Coordinate} Position.
 */
ol.Camera.prototype.getPosition = function() {
  return /** @type {goog.math.Coordinate} */ (
      this.get(ol.CameraProperty.POSITION));
};


/**
 * @return {number} Resolution.
 */
ol.Camera.prototype.getResolution = function() {
  return /** @type {number} */ (this.get(ol.CameraProperty.RESOLUTION));
};


/**
 * @return {number} Rotation.
 */
ol.Camera.prototype.getRotation = function() {
  return /** @type {number} */ (this.get(ol.CameraProperty.ROTATION));
};


/**
 * @return {boolean} Is fully defined.
 */
ol.Camera.prototype.isFullyDefined = function() {
  return goog.isDef(this.getPosition()) && goog.isDef(this.getResolution()) &&
      goog.isDef(this.getRotation());
};


/**
 * @param {goog.math.Coordinate} position Position.
 */
ol.Camera.prototype.setPosition = function(position) {
  this.set(ol.CameraProperty.POSITION, position.clone());
};


/**
 * @param {number} resolution Resolution.
 */
ol.Camera.prototype.setResolution = function(resolution) {
  this.set(ol.CameraProperty.RESOLUTION, resolution);
};


/**
 * @param {number} rotation Rotation.
 */
ol.Camera.prototype.setRotation = function(rotation) {
  this.set(ol.CameraProperty.ROTATION, rotation);
};
