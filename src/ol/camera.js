goog.provide('ol.Camera');

goog.require('goog.math.Coordinate');
goog.require('ol.MVCObject');


/**
 * @enum {string}
 * @private
 */
ol.CameraProperty_ = {
  POSITION: 'center',
  RESOLUTION: 'resolution',
  ROTATION: 'rotation'
};



/**
 * @constructor
 * @extends {ol.MVCObject}
 */
ol.Camera = function() {

  goog.base(this);

};
goog.inherits(ol.Camera, ol.MVCObject);


/**
 * @return {goog.math.Coordinate} Position.
 */
ol.Camera.prototype.getPosition = function() {
  return /** @type {goog.math.Coordinate} */ (
      this.get(ol.CameraProperty_.POSITION));
};


/**
 * @return {number} Resolution.
 */
ol.Camera.prototype.getResolution = function() {
  return /** @type {number} */ (this.get(ol.CameraProperty_.RESOLUTION));
};


/**
 * @return {number} Rotation.
 */
ol.Camera.prototype.getRotation = function() {
  return /** @type {number} */ (this.get(ol.CameraProperty_.ROTATION));
};


/**
 * @param {goog.math.Coordinate} position Position.
 */
ol.Camera.prototype.setPosition = function(position) {
  this.set(ol.CameraProperty_.POSITION, position.clone());
};


/**
 * @param {number} resolution Resolution.
 */
ol.Camera.prototype.setResolution = function(resolution) {
  this.set(ol.CameraProperty_.RESOLUTION, resolution);
};


/**
 * @param {number} rotation Rotation.
 */
ol.Camera.prototype.setRotation = function(rotation) {
  this.set(ol.CameraProperty_.ROTATION, rotation);
};
